"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/header/header";
import Sidebar from "@/components/sidebar/sidebar";
import Button from "@/components/button/button";
import PythonCompiler, {
  preloadPythonCompilerAssets,
} from "@/components/pythonCompiler/pythonCompiler";
import GuessCodeGame from "@/components/games/guessCode/guessCode";
import FixCodeGame from "@/components/games/fixCode/fixCode";
import MemoryMatchGame from "@/components/games/memoryMatch/memoryMatch";
import { COURSE_THEORY_PAYLOADS } from "./mockCourseData";
import type {
  CourseItemDTO,
  CourseLessonItemDTO,
  CourseTheoryPayloadDTO,
} from "./types";
import {
  ApiError,
  CourseTreePublic,
  TaskType,
  getApiErrorMessage,
  getCourseTree,
  submitTaskAnswer,
} from "@/shared/api/client";
import { getAccessToken } from "@/shared/auth/tokens";
import styles from "./course.module.css";

interface RemoteLessonMeta {
  taskId: number;
  taskType: TaskType;
}

interface RemotePayloadResult {
  payload: CourseTheoryPayloadDTO;
  lessonMetaById: Record<string, RemoteLessonMeta>;
}

function getCourseItemKey(item: CourseItemDTO): string {
  if (item.type === "theme") {
    return `${item.moduleId}-${item.themeId}-theme`;
  }

  if (item.type === "lesson") {
    return `${item.moduleId}-${item.themeId}-${item.lessonId}`;
  }

  return `${item.moduleId}-${item.themeId}-${item.gameId}`;
}

function getFallbackCourse(): CourseTheoryPayloadDTO | undefined {
  return COURSE_THEORY_PAYLOADS[0];
}

function buildPayloadFromTree(tree: CourseTreePublic): RemotePayloadResult {
  const lessonMetaById: Record<string, RemoteLessonMeta> = {};
  const flow: CourseItemDTO[] = [];

  const modules = tree.modules.map((module) => ({
    moduleId: String(module.id),
    title: module.title,
    themes: module.topics.map((topic) => ({
      themeId: String(topic.id),
      title: topic.title,
      lessons: topic.tasks.map((task) => ({
        lessonId: `task-${task.id}`,
        title: task.title,
      })),
    })),
  }));

  for (const module of tree.modules) {
    for (const topic of module.topics) {
      const moduleId = String(module.id);
      const themeId = String(topic.id);

      flow.push({
        type: "theme",
        moduleId,
        themeId,
        title: topic.title,
        text: topic.description ?? "Изучи материалы темы и переходи к заданиям.",
      });

      for (const task of topic.tasks) {
        const lessonId = `task-${task.id}`;
        lessonMetaById[lessonId] = {
          taskId: task.id,
          taskType: task.task_type,
        };

        flow.push({
          type: "lesson",
          moduleId,
          themeId,
          lessonId,
          title: task.title,
          text: task.description ?? "Выполни задание и отправь ответ.",
          showCompiler: task.task_type !== "lecture",
        });
      }
    }
  }

  return {
    payload: {
      courseId: String(tree.id),
      courseTitle: tree.title,
      audience: tree.category?.title ?? undefined,
      modules,
      flow,
    },
    lessonMetaById,
  };
}

function CourseTheoryPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedCourseId = searchParams.get("courseId");

  const [selectedCourseId, setSelectedCourseId] = useState(
    getFallbackCourse()?.courseId ?? ""
  );
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  const [remotePayload, setRemotePayload] = useState<CourseTheoryPayloadDTO | null>(null);
  const [remoteLessonMetaById, setRemoteLessonMetaById] = useState<
    Record<string, RemoteLessonMeta>
  >({});
  const [isRemoteLoading, setIsRemoteLoading] = useState(false);
  const [remoteError, setRemoteError] = useState("");

  const [answerBody, setAnswerBody] = useState("");
  const [answerMessage, setAnswerMessage] = useState("");
  const [isAnswerSubmitting, setIsAnswerSubmitting] = useState(false);

  useEffect(() => {
    const warmup = () => {
      void preloadPythonCompilerAssets();
    };

    if (typeof globalThis.requestIdleCallback === "function") {
      const idleId = globalThis.requestIdleCallback(warmup, { timeout: 1500 });
      return () => globalThis.cancelIdleCallback(idleId);
    }

    const timeoutId = setTimeout(warmup, 500);
    return () => clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    if (!requestedCourseId) {
      setRemotePayload(null);
      setRemoteLessonMetaById({});
      setRemoteError("");
      return;
    }

    const numericCourseId = Number(requestedCourseId);

    if (!Number.isInteger(numericCourseId) || numericCourseId <= 0) {
      setRemotePayload(null);
      setRemoteLessonMetaById({});
      setRemoteError("Некорректный идентификатор курса.");
      return;
    }

    const accessToken = getAccessToken();

    if (!accessToken) {
      router.replace("/login");
      return;
    }

    let cancelled = false;

    const loadRemoteCourse = async () => {
      try {
        setIsRemoteLoading(true);
        setRemoteError("");

        const tree = await getCourseTree(numericCourseId);

        if (cancelled) {
          return;
        }

        const converted = buildPayloadFromTree(tree);
        setRemotePayload(converted.payload);
        setRemoteLessonMetaById(converted.lessonMetaById);
        setSelectedCourseId(converted.payload.courseId);
      } catch (error) {
        if (cancelled) {
          return;
        }

        if (error instanceof ApiError && error.status === 401) {
          router.replace("/login");
          return;
        }

        setRemotePayload(null);
        setRemoteLessonMetaById({});
        setRemoteError(
          getApiErrorMessage(error, "Не удалось загрузить структуру курса.")
        );
      } finally {
        if (!cancelled) {
          setIsRemoteLoading(false);
        }
      }
    };

    void loadRemoteCourse();

    return () => {
      cancelled = true;
    };
  }, [requestedCourseId, router]);

  const coursePayload = useMemo(() => {
    if (remotePayload) {
      return remotePayload;
    }

    const found = COURSE_THEORY_PAYLOADS.find(
      (course) => course.courseId === selectedCourseId
    );
    return found ?? getFallbackCourse();
  }, [remotePayload, selectedCourseId]);

  const courseFlow = coursePayload?.flow ?? [];
  const isRemoteMode = Boolean(remotePayload);

  useEffect(() => {
    setCurrentIndex(0);
  }, [coursePayload?.courseId]);

  useEffect(() => {
    setAnswerBody("");
    setAnswerMessage("");
  }, [coursePayload?.courseId, currentIndex]);

  if (isRemoteLoading) {
    return (
      <div>
        <Header />
        <main className={styles.emptyState}>Загружаем структуру курса...</main>
      </div>
    );
  }

  if (requestedCourseId && remoteError && !remotePayload) {
    return (
      <div>
        <Header />
        <main className={styles.emptyState}>{remoteError}</main>
      </div>
    );
  }

  if (!coursePayload || courseFlow.length === 0) {
    return (
      <div>
        <Header />
        <main className={styles.emptyState}>Курс пока не заполнен.</main>
      </div>
    );
  }

  const safeIndex = Math.min(currentIndex, Math.max(courseFlow.length - 1, 0));
  const totalFlowSteps = courseFlow.length;
  const currentStep = safeIndex + 1;
  const isLastStep = safeIndex === courseFlow.length - 1;

  const currentItem = courseFlow[safeIndex];
  const currentThemeItems = courseFlow.filter(
    (item) => item.themeId === currentItem.themeId
  );
  const currentThemeStep = Math.max(
    currentThemeItems.findIndex(
      (item) => getCourseItemKey(item) === getCourseItemKey(currentItem)
    ) + 1,
    1
  );

  const currentLesson: CourseLessonItemDTO | null =
    currentItem.type === "lesson" ? currentItem : null;
  const currentGame = currentItem.type === "game" ? currentItem : null;

  const currentRemoteLessonMeta = currentLesson
    ? remoteLessonMetaById[currentLesson.lessonId]
    : undefined;
  const currentRemoteTaskType = currentRemoteLessonMeta?.taskType;
  const canSubmitRemoteAnswer = Boolean(
    currentRemoteLessonMeta && currentRemoteTaskType !== "lecture"
  );

  const shouldShowCompiler = Boolean(
    currentLesson &&
      (currentRemoteTaskType
        ? currentRemoteTaskType !== "lecture"
        : currentLesson.showCompiler !== false)
  );

  const activeModuleId = currentItem.moduleId;
  const activeThemeId = currentItem.themeId;
  const activeLessonId =
    currentItem.type === "lesson"
      ? currentItem.lessonId
      : currentItem.type === "game"
        ? currentItem.lessonId
        : undefined;

  const currentContent =
    currentItem.type === "game"
      ? currentItem.description
      : currentItem.contentMd ?? currentItem.text;

  const handleThemeSelect = (themeId: string) => {
    const index = courseFlow.findIndex(
      (item) => item.type === "theme" && item.themeId === themeId
    );
    if (index !== -1) {
      setCurrentIndex(index);
    }
  };

  const handleLessonSelect = (themeId: string, lessonId: string) => {
    const index = courseFlow.findIndex(
      (item) =>
        item.type === "lesson" &&
        item.themeId === themeId &&
        item.lessonId === lessonId
    );
    if (index !== -1) {
      setCurrentIndex(index);
    }
  };

  const handleNext = () => {
    if (isLastStep) {
      router.push("/");
      return;
    }

    setCurrentIndex((prev) => Math.min(prev + 1, courseFlow.length - 1));
  };

  const handleSubmitAnswer = async () => {
    if (!currentRemoteLessonMeta) {
      return;
    }

    if (!answerBody.trim()) {
      setAnswerMessage("Введите ответ перед отправкой.");
      return;
    }

    try {
      setIsAnswerSubmitting(true);
      const response = await submitTaskAnswer(
        currentRemoteLessonMeta.taskId,
        answerBody.trim()
      );

      const achievementPart =
        response.awarded_achievements.length > 0
          ? ` Новые достижения: ${response.awarded_achievements
              .map((achievement) => achievement.title)
              .join(", ")}.`
          : "";

      setAnswerMessage(
        `${response.message}. +${response.awarded_xp} XP. Прогресс курса: ${Math.round(
          response.progress_percent
        )}%.${achievementPart}`
      );
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        router.replace("/login");
        return;
      }

      setAnswerMessage(getApiErrorMessage(error, "Не удалось проверить ответ."));
    } finally {
      setIsAnswerSubmitting(false);
    }
  };

  return (
    <div>
      <Header />
      <div className={styles.page}>
        <Sidebar
          totalSteps={totalFlowSteps}
          completedSteps={currentStep}
          isOpen={isSidebarOpen}
          onToggle={() => setIsSidebarOpen((prev) => !prev)}
          courseTitle={coursePayload.courseTitle}
          modules={coursePayload.modules.map((module) => ({
            moduleId: module.moduleId,
            title: module.title,
            themes: module.themes.map((theme) => ({
              themeId: theme.themeId,
              title: theme.title,
              lessons: theme.lessons.map((lesson) => ({
                lessonId: lesson.lessonId,
                title: lesson.title,
              })),
            })),
          }))}
          activeModuleId={activeModuleId}
          activeThemeId={activeThemeId}
          activeLessonId={activeLessonId}
          onThemeSelect={handleThemeSelect}
          onLessonSelect={handleLessonSelect}
        />

        <main className={styles.content}>
          {!isRemoteMode && (
            <div className={styles.courseSwitch}>
              {COURSE_THEORY_PAYLOADS.map((course) => (
                <Button
                  key={course.courseId}
                  title={course.courseTitle}
                  size="s"
                  variant={selectedCourseId === course.courseId ? "filled" : "outline"}
                  color={selectedCourseId === course.courseId ? "logo" : "blue"}
                  className={styles.courseSwitchButton}
                  onClick={() => setSelectedCourseId(course.courseId)}
                />
              ))}
            </div>
          )}

          {coursePayload.audience && (
            <p className={styles.audienceText}>Аудитория: {coursePayload.audience}</p>
          )}

          <div className={styles.stepBanner}>
            <div className={styles.stepBannerTop}>
              Шаг {currentThemeStep} из {currentThemeItems.length}
            </div>
            <div className={styles.stepBannerBottom}>
              <div className={styles.stepSegments}>
                {currentThemeItems.map((item, index) => (
                  <span
                    key={getCourseItemKey(item)}
                    className={`${styles.stepSegment} ${
                      index + 1 === currentThemeStep ? styles.stepSegmentActive : ""
                    }`.trim()}
                  />
                ))}
              </div>
            </div>
          </div>

          <h1 className={styles.contentTitle}>{currentItem.title}</h1>
          {currentContent && <p className={styles.contentText}>{currentContent}</p>}

          {currentLesson && (
            <div className={styles.practiceStack}>
              {shouldShowCompiler && (
                <div className={styles.compilerBlock}>
                  <PythonCompiler
                    key={`compiler-${currentLesson.moduleId}-${currentLesson.themeId}-${currentLesson.lessonId}`}
                    title="Практика в Python"
                    initialCode=""
                  />
                </div>
              )}

              {canSubmitRemoteAnswer && (
                <section className={styles.quizBlock}>
                  <h2 className={styles.quizTitle}>Ответ на задание</h2>
                  <textarea
                    className={styles.answerInput}
                    placeholder="Введите ответ и отправьте на проверку"
                    value={answerBody}
                    onChange={(event) => setAnswerBody(event.target.value)}
                    rows={4}
                  />
                  <div className={styles.quizActions}>
                    <Button
                      size="m"
                      variant="filled"
                      color="logo"
                      title={isAnswerSubmitting ? "Проверяем..." : "Отправить ответ"}
                      onClick={handleSubmitAnswer}
                      disabled={isAnswerSubmitting}
                    />
                  </div>
                  {answerMessage && (
                    <p className={styles.answerStatusText}>{answerMessage}</p>
                  )}
                </section>
              )}
            </div>
          )}

          {currentGame && (
            <section className={styles.gameBlock}>
              {currentGame.gameType === "memoryMatch" && currentGame.memoryPairs && (
                <MemoryMatchGame pairs={currentGame.memoryPairs} />
              )}

              {currentGame.gameType === "guessCode" && currentGame.guessCodeQuestions && (
                <GuessCodeGame questions={currentGame.guessCodeQuestions} />
              )}

              {currentGame.gameType === "fixCode" && currentGame.fixCodeTasks && (
                <FixCodeGame tasks={currentGame.fixCodeTasks} />
              )}
            </section>
          )}

          <div className={styles.nextButton}>
            <Button
              size="m"
              variant="filled"
              color="logo"
              fullWidth
              title={isLastStep ? "В каталог" : "Дальше"}
              onClick={handleNext}
            />
          </div>
        </main>
      </div>
    </div>
  );
}

export default function CourseTheoryPage() {
  return (
    <Suspense
      fallback={
        <div>
          <Header />
          <main className={styles.emptyState}>Загружаем курс...</main>
        </div>
      }
    >
      <CourseTheoryPageContent />
    </Suspense>
  );
}
