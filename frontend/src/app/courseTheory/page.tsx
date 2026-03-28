"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/header/header";
import Sidebar from "@/components/sidebar/sidebar";
import Button from "@/components/button/button";
import FixCodeGame from "@/components/games/fixCode/fixCode";
import GuessCodeGame from "@/components/games/guessCode/guessCode";
import MemoryMatchGame from "@/components/games/memoryMatch/memoryMatch";
import PythonCompiler from "@/components/pythonCompiler/pythonCompiler";
import {
  ApiError,
  CourseTreePublic,
  TaskAnswerResponse,
  TaskTreePublic,
  completeTaskActivity,
  getApiErrorMessage,
  getCourseTree,
  submitTaskAnswer,
} from "@/shared/api/client";
import { getAccessToken } from "@/shared/auth/tokens";
import { getLessonEnhancement } from "./lessonEnhancements";
import styles from "./course.module.css";

interface FlatLessonRef {
  moduleId: string;
  moduleTitle: string;
  themeId: string;
  themeTitle: string;
  themeSummary: string;
  lesson: TaskTreePublic;
  isFinal: boolean;
}

type MessageTone = "default" | "success" | "error";

function isFinalTask(task: TaskTreePublic): boolean {
  const source = `${task.title} ${task.description ?? ""}`.toLowerCase();
  return source.includes("итог") || source.includes("финал");
}

function flattenLessons(program: CourseTreePublic): FlatLessonRef[] {
  const flat: FlatLessonRef[] = [];

  for (const module of program.modules) {
    for (const theme of module.topics) {
      for (const lesson of theme.tasks) {
        flat.push({
          moduleId: String(module.id),
          moduleTitle: module.title,
          themeId: String(theme.id),
          themeTitle: theme.title,
          themeSummary: theme.description ?? "",
          lesson,
          isFinal: isFinalTask(lesson),
        });
      }
    }
  }

  return flat;
}

function CourseTheoryPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const courseIdFromQuery = Number(searchParams.get("courseId") ?? "0");
  const courseId =
    Number.isFinite(courseIdFromQuery) && courseIdFromQuery > 0 ? courseIdFromQuery : null;

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedLessonId, setSelectedLessonId] = useState<string>("");
  const [courseTree, setCourseTree] = useState<CourseTreePublic | null>(null);
  const [sessionCompletedIds, setSessionCompletedIds] = useState<number[]>([]);
  const [selectedOptionByTaskId, setSelectedOptionByTaskId] = useState<Record<number, string>>(
    {}
  );
  const [progressPercent, setProgressPercent] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<MessageTone>("default");

  const lessons = useMemo(() => (courseTree ? flattenLessons(courseTree) : []), [courseTree]);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.replace("/login");
    }
  }, [router]);

  useEffect(() => {
    if (!courseId) {
      setErrorMessage("Некорректный идентификатор курса.");
      setIsLoading(false);
      return;
    }

    const token = getAccessToken();
    if (!token) {
      return;
    }

    let cancelled = false;

    const loadCourseTree = async () => {
      try {
        setIsLoading(true);
        setErrorMessage("");

        const response = await getCourseTree(courseId);
        if (cancelled) {
          return;
        }

        setCourseTree(response);
        setProgressPercent(response.progress_percent ?? 0);
        setSessionCompletedIds([]);
        setViewedLectureIds([]);
        setSelectedOptionByTaskId({});
        setSelectedLessonId("");
        setMessage("");
      } catch (error) {
        if (cancelled) {
          return;
        }

        if (error instanceof ApiError && error.status === 401) {
          router.replace("/login");
          return;
        }

        setErrorMessage(getApiErrorMessage(error, "Не удалось загрузить структуру курса."));
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadCourseTree();

    return () => {
      cancelled = true;
    };
  }, [courseId, router]);

  const sessionCompletedSet = useMemo(() => new Set(sessionCompletedIds), [sessionCompletedIds]);
  const viewedLectureSet = useMemo(() => new Set(viewedLectureIds), [viewedLectureIds]);

  const unlockedByLessonId = useMemo(() => {
    const unlocked = new Map<string, boolean>();

    const isDone = (item: FlatLessonRef): boolean =>
      item.lesson.task_type === "lecture"
        ? viewedLectureSet.has(item.lesson.id)
        : sessionCompletedSet.has(item.lesson.id);

    const allRequiredBeforeFinalDone = lessons
      .filter((item) => !item.isFinal)
      .every((item) => isDone(item));

    for (const [index, item] of lessons.entries()) {
      const requiredBeforeDone = lessons.slice(0, index).every((prev) => isDone(prev));
      let isUnlocked = index === 0 || requiredBeforeDone || isDone(item);

      if (item.isFinal && !allRequiredBeforeFinalDone && !sessionCompletedSet.has(item.lesson.id)) {
        isUnlocked = false;
      }

      unlocked.set(String(item.lesson.id), isUnlocked);
    }

    return unlocked;
  }, [lessons, sessionCompletedSet, viewedLectureSet]);

  useEffect(() => {
    if (lessons.length === 0) {
      return;
    }

    if (selectedLessonId && unlockedByLessonId.get(selectedLessonId)) {
      return;
    }

    const firstUnlocked = lessons.find((item) => unlockedByLessonId.get(String(item.lesson.id)));
    setSelectedLessonId(String((firstUnlocked ?? lessons[0]).lesson.id));
  }, [lessons, selectedLessonId, unlockedByLessonId]);

  const currentIndex = useMemo(() => {
    if (lessons.length === 0) {
      return -1;
    }

    const index = lessons.findIndex((item) => String(item.lesson.id) === selectedLessonId);
    return index >= 0 ? index : 0;
  }, [lessons, selectedLessonId]);

  const currentLessonRef = currentIndex >= 0 ? lessons[currentIndex] : null;
  const activeLesson = currentLessonRef?.lesson ?? null;
  const activeThemeId = currentLessonRef?.themeId;
  const isActiveUnlocked = activeLesson
    ? Boolean(unlockedByLessonId.get(String(activeLesson.id)))
    : false;

  useEffect(() => {
    if (!activeLesson || !isActiveUnlocked || activeLesson.task_type !== "lecture") {
      return;
    }

    setViewedLectureIds((prev) => (prev.includes(activeLesson.id) ? prev : [...prev, activeLesson.id]));
  }, [activeLesson, isActiveUnlocked]);

  const activeThemeLessons = useMemo(() => {
    if (!activeThemeId) {
      return [];
    }

    return lessons.filter((item) => item.themeId === activeThemeId);
  }, [activeThemeId, lessons]);

  const currentThemeStep = useMemo(() => {
    if (!currentLessonRef || activeThemeLessons.length === 0) {
      return 1;
    }

    const index = activeThemeLessons.findIndex((item) => item.lesson.id === currentLessonRef.lesson.id);
    return index >= 0 ? index + 1 : 1;
  }, [activeThemeLessons, currentLessonRef]);

  const lessonEnhancement = useMemo(() => {
    if (!activeLesson) {
      return null;
    }

    return getLessonEnhancement(courseTree?.category?.title, activeLesson);
  }, [activeLesson, courseTree?.category?.title]);

  const handleWrongLesson = (customMessage?: string) => {
    setMessageTone("error");
    setMessage(customMessage ?? "Неверно. Попробуй ещё раз.");
  };

  const pushXpEvent = (totalXp: number, deltaXp: number) => {
    if (typeof window === "undefined") {
      return;
    }

    window.dispatchEvent(
      new CustomEvent("profile:xp-updated", {
        detail: {
          totalXp,
          deltaXp,
        },
      })
    );
  };

  const handleSuccessResult = (response: TaskAnswerResponse, baseMessage: string) => {
    setProgressPercent(response.progress_percent);
    setSessionCompletedIds((prev) =>
      activeLesson && !prev.includes(activeLesson.id) ? [...prev, activeLesson.id] : prev
    );

    if (response.awarded_xp > 0) {
      pushXpEvent(response.total_xp, response.awarded_xp);
      setMessageTone("success");
      setMessage(`${baseMessage} +${response.awarded_xp} XP.`);
      return;
    }

    setMessageTone("success");
    setMessage(`${baseMessage} Урок уже был засчитан раньше.`);
  };

  const handleSingleQuestionCheck = async () => {
    if (!activeLesson || !lessonEnhancement?.singleQuestion) {
      return;
    }

    if (!isActiveUnlocked) {
      handleWrongLesson("Сначала пройди предыдущие уроки.");
      return;
    }

    const selectedOptionId = selectedOptionByTaskId[activeLesson.id] ?? "";
    if (!selectedOptionId) {
      handleWrongLesson("Выбери ответ.");
      return;
    }

    const selectedOption = lessonEnhancement.singleQuestion.options.find(
      (option) => option.id === selectedOptionId
    );

    if (!selectedOption) {
      handleWrongLesson("Выбери ответ.");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await submitTaskAnswer(activeLesson.id, selectedOption.label);

      if (!response.is_correct) {
        handleWrongLesson("Неверно. Попробуй ещё раз.");
        setProgressPercent(response.progress_percent);
        return;
      }

      handleSuccessResult(response, "Верно.");
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        router.replace("/login");
        return;
      }
      handleWrongLesson(getApiErrorMessage(error, "Не удалось проверить ответ."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCompleteActivity = async () => {
    if (!activeLesson) {
      return;
    }

    if (!isActiveUnlocked) {
      handleWrongLesson("Сначала пройди предыдущие уроки.");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await completeTaskActivity(activeLesson.id);
      handleSuccessResult(response, "Урок засчитан.");
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        router.replace("/login");
        return;
      }
      handleWrongLesson(getApiErrorMessage(error, "Не удалось завершить урок."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleThemeSelect = (themeId: string) => {
    const themeLessons = lessons.filter((item) => item.themeId === themeId);
    const firstUnlocked = themeLessons.find((item) => unlockedByLessonId.get(String(item.lesson.id)));

    if (!firstUnlocked) {
      handleWrongLesson("Тема пока заблокирована.");
      return;
    }

    setSelectedLessonId(String(firstUnlocked.lesson.id));
    setMessage("");
  };

  const handleLessonSelect = (_themeId: string, lessonId: string) => {
    if (!unlockedByLessonId.get(lessonId)) {
      handleWrongLesson("Урок пока заблокирован.");
      return;
    }

    setSelectedLessonId(lessonId);
    setMessage("");
  };

  const handleNext = () => {
    if (currentIndex < 0) {
      return;
    }

    if (currentIndex >= lessons.length - 1) {
      router.push("/");
      return;
    }

    const nextLesson = lessons[currentIndex + 1];
    if (!unlockedByLessonId.get(String(nextLesson.lesson.id))) {
      handleWrongLesson("Следующий урок пока заблокирован.");
      return;
    }

    setSelectedLessonId(String(nextLesson.lesson.id));
    setMessage("");
  };

  const totalRequiredSteps = lessons.filter((item) => item.lesson.task_type !== "lecture").length;
  const completedSteps =
    totalRequiredSteps > 0
      ? Math.min(
          totalRequiredSteps,
          Math.max(
            Math.round((progressPercent / 100) * totalRequiredSteps),
            sessionCompletedIds.length
          )
        )
      : 0;

  if (isLoading) {
    return (
      <div>
        <Header />
        <main className={styles.emptyState}>Загружаем курс...</main>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div>
        <Header />
        <main className={styles.emptyState}>{errorMessage}</main>
      </div>
    );
  }

  if (!courseTree || !currentLessonRef || !activeLesson || !lessonEnhancement) {
    return (
      <div>
        <Header />
        <main className={styles.emptyState}>В курсе пока нет уроков.</main>
      </div>
    );
  }

  const isCompleted =
    activeLesson.task_type === "lecture"
      ? viewedLectureSet.has(activeLesson.id)
      : sessionCompletedSet.has(activeLesson.id);

  const messageClass =
    messageTone === "success"
      ? styles.messageSuccess
      : messageTone === "error"
        ? styles.messageError
        : styles.messageDefault;

  const interactionLabel =
    lessonEnhancement.interactionType === "game"
      ? "Игра"
      : lessonEnhancement.interactionType === "compiler"
        ? "Компилятор"
        : "Один вопрос";

  const showCompleteButton =
    activeLesson.task_type !== "lecture" &&
    (lessonEnhancement.interactionType === "game" ||
      lessonEnhancement.interactionType === "compiler");

  return (
    <div>
      <Header />
      <div className={styles.page}>
        <Sidebar
          totalSteps={Math.max(totalRequiredSteps, 1)}
          completedSteps={completedSteps}
          isOpen={isSidebarOpen}
          onToggle={() => setIsSidebarOpen((prev) => !prev)}
          courseTitle={courseTree.title}
          modules={courseTree.modules.map((module) => ({
            moduleId: String(module.id),
            title: module.title,
            themes: module.topics.map((theme) => ({
              themeId: String(theme.id),
              title: theme.title,
              isDisabled: (() => {
                const firstTask = theme.tasks[0];
                if (!firstTask) {
                  return false;
                }

                return !unlockedByLessonId.get(String(firstTask.id));
              })(),
              lessons: theme.tasks.map((lesson) => ({
                lessonId: String(lesson.id),
                title: lesson.title,
                isDisabled: !unlockedByLessonId.get(String(lesson.id)),
              })),
            })),
          }))}
          activeModuleId={currentLessonRef.moduleId}
          activeThemeId={currentLessonRef.themeId}
          activeLessonId={String(activeLesson.id)}
          onThemeSelect={handleThemeSelect}
          onLessonSelect={handleLessonSelect}
        />

        <main className={styles.content}>
          <p className={styles.audienceText}>Прогресс курса: {Math.round(progressPercent)}%</p>

          <div className={styles.stepBanner}>
            <div className={styles.stepBannerTop}>
              Шаг {currentThemeStep} из {activeThemeLessons.length}
            </div>
            <div className={styles.stepBannerBottom}>
              <div className={styles.stepSegments}>
                {activeThemeLessons.map((lessonRef, index) => (
                  <span
                    key={lessonRef.lesson.id}
                    className={`${styles.stepSegment} ${
                      index + 1 === currentThemeStep ? styles.stepSegmentActive : ""
                    }`.trim()}
                  />
                ))}
              </div>
            </div>
          </div>

          <p className={styles.metaLine}>
            {currentLessonRef.moduleTitle} · {currentLessonRef.themeTitle}
          </p>
          <h1 className={styles.contentTitle}>{activeLesson.title}</h1>
          <p className={styles.contentText}>
            {activeLesson.description?.trim() || "Описание урока пока не добавлено."}
          </p>
          <p className={styles.themeSummary}>{currentLessonRef.themeSummary}</p>

          <div className={styles.lessonMeta}>
            <span className={styles.lessonBadge}>Формат: {interactionLabel}</span>
            <span className={styles.lessonBadge}>Награда: {activeLesson.xp_reward} XP</span>
            {isCompleted && <span className={styles.lessonBadgeDone}>Урок уже пройден</span>}
          </div>

          <div className={styles.practiceStack}>
            {lessonEnhancement.interactionType === "theory" && (
              <section className={styles.quizBlock}>
                <h2 className={styles.quizTitle}>Теория</h2>
                <p className={styles.quizSummary}>
                  Прочитай материал урока. После лекции переходи к практике и квизам.
                </p>
              </section>
            )}

            {lessonEnhancement.interactionType === "singleQuestion" &&
              lessonEnhancement.singleQuestion && (
                <section className={styles.quizBlock}>
                  <h2 className={styles.quizTitle}>Один простой вопрос</h2>
                  <p className={styles.quizSummary}>{lessonEnhancement.singleQuestion.prompt}</p>

                  <div className={styles.singleQuestionOptions}>
                    {lessonEnhancement.singleQuestion.options.map((option) => (
                      <label key={option.id} className={styles.singleQuestionOption}>
                        <input
                          type="radio"
                          name={`single-question-${activeLesson.id}`}
                          checked={selectedOptionByTaskId[activeLesson.id] === option.id}
                          onChange={() =>
                            setSelectedOptionByTaskId((prev) => ({
                              ...prev,
                              [activeLesson.id]: option.id,
                            }))
                          }
                          disabled={!isActiveUnlocked || isSubmitting}
                        />
                        <span>{option.label}</span>
                      </label>
                    ))}
                  </div>

                  <div className={styles.quizActions}>
                    <Button
                      size="m"
                      variant="filled"
                      color="logo"
                      title={isSubmitting ? "Проверяем..." : "Проверить"}
                      onClick={() => void handleSingleQuestionCheck()}
                      disabled={!isActiveUnlocked || isSubmitting}
                    />
                  </div>
                </section>
              )}

            {lessonEnhancement.interactionType === "game" && (
              <section className={styles.gameBlock}>
                <h2 className={styles.quizTitle}>{lessonEnhancement.gameTitle}</h2>
                <p className={styles.gameDescription}>{lessonEnhancement.gameDescription}</p>

                {lessonEnhancement.gameType === "memoryMatch" &&
                  lessonEnhancement.memoryPairs &&
                  lessonEnhancement.memoryPairs.length > 0 && (
                    <MemoryMatchGame pairs={lessonEnhancement.memoryPairs} />
                  )}

                {lessonEnhancement.gameType === "guessCode" &&
                  lessonEnhancement.guessCodeQuestions &&
                  lessonEnhancement.guessCodeQuestions.length > 0 && (
                    <GuessCodeGame questions={lessonEnhancement.guessCodeQuestions} />
                  )}

                {lessonEnhancement.gameType === "fixCode" &&
                  lessonEnhancement.fixCodeTasks &&
                  lessonEnhancement.fixCodeTasks.length > 0 && (
                    <FixCodeGame tasks={lessonEnhancement.fixCodeTasks} />
                  )}

                {showCompleteButton && (
                  <div className={styles.activityActions}>
                    <Button
                      size="m"
                      variant="filled"
                      color="logo"
                      title={isSubmitting ? "Сохраняем..." : "Завершить урок"}
                      onClick={() => void handleCompleteActivity()}
                      disabled={!isActiveUnlocked || isSubmitting}
                    />
                  </div>
                )}
              </section>
            )}

            {lessonEnhancement.interactionType === "compiler" && (
              <section className={styles.quizBlock}>
                <h2 className={styles.quizTitle}>{lessonEnhancement.compilerTitle}</h2>
                <PythonCompiler
                  title={lessonEnhancement.compilerTitle}
                  initialCode={lessonEnhancement.compilerInitialCode}
                  onCodeChange={(code) =>
                    setCompilerCodeByTaskId((prev) => ({
                      ...prev,
                      [activeLesson.id]: code,
                    }))
                  }
                />

                {showCompilerCheckButton && (
                  <div className={styles.activityActions}>
                    <Button
                      size="m"
                      variant="filled"
                      color="logo"
                      title={isSubmitting ? "Сохраняем..." : "Завершить урок"}
                      onClick={() => void handleCompleteActivity()}
                      disabled={!isActiveUnlocked || isSubmitting}
                    />
                  </div>
                )}
              </section>
            )}
          </div>

          {message && <p className={`${styles.statusMessage} ${messageClass}`.trim()}>{message}</p>}

          <div className={styles.nextButton}>
            <Button
              size="m"
              variant="filled"
              color="logo"
              fullWidth
              title={currentIndex >= lessons.length - 1 ? "В каталог" : "Дальше"}
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
