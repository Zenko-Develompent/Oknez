"use client";

import { useEffect, useMemo, useState } from "react";
import Header from "@/components/header/header";
import Sidebar from "@/components/sidebar/sidebar";
import Button from "@/components/button/button";
import SingleChoice from "@/components/singleChoice/singleChoice";
import MultipleChoice from "@/components/multipleChoice/multipleChoice";
import PythonCompiler, {
  preloadPythonCompilerAssets,
} from "@/components/pythonCompiler/pythonCompiler";
import { LOCAL_COURSE_THEORY_PAYLOAD } from "./mockCourseData";
import type { CourseItemDTO, CourseLessonItemDTO, QuizQuestionDTO } from "./types";
import styles from "./course.module.css";

type QuestionResultStatus = "correct" | "incorrect" | "unanswered";

interface LessonCheckResult {
  score: number;
  total: number;
  questionStatusById: Record<string, QuestionResultStatus>;
}

function getCourseItemKey(item: CourseItemDTO): string {
  if (item.type === "theme") {
    return `${item.themeId}-theme`;
  }

  return `${item.themeId}-${item.lessonId}`;
}

function normalizeOptionIds(values: string[]): string[] {
  return Array.from(new Set(values)).sort();
}

function areSameSelections(left: string[], right: string[]): boolean {
  if (left.length !== right.length) {
    return false;
  }

  return left.every((value, index) => value === right[index]);
}

function evaluateQuestionAnswer(
  question: QuizQuestionDTO,
  selectedValues: string[] | undefined
): QuestionResultStatus {
  const selected = normalizeOptionIds(selectedValues ?? []);
  if (selected.length === 0) {
    return "unanswered";
  }

  const expected = normalizeOptionIds(question.correctOptionIds);
  return areSameSelections(selected, expected) ? "correct" : "incorrect";
}

function buildLessonCheckResult(
  questions: QuizQuestionDTO[],
  answersByQuestion: Record<string, string[]>
): LessonCheckResult {
  const questionStatusById: Record<string, QuestionResultStatus> = {};
  let score = 0;

  for (const question of questions) {
    const status = evaluateQuestionAnswer(question, answersByQuestion[question.id]);
    questionStatusById[question.id] = status;

    if (status === "correct") {
      score += 1;
    }
  }

  return {
    score,
    total: questions.length,
    questionStatusById,
  };
}

function getCorrectAnswersText(question: QuizQuestionDTO): string {
  const labels = question.options
    .filter((option) => question.correctOptionIds.includes(option.id))
    .map((option) => option.label);

  return labels.join(", ");
}

export default function CourseTheoryPage() {
  const coursePayload = LOCAL_COURSE_THEORY_PAYLOAD;
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lessonAnswers, setLessonAnswers] = useState<
    Record<string, Record<string, string[]>>
  >({});
  const [lessonCheckResults, setLessonCheckResults] = useState<
    Record<string, LessonCheckResult>
  >({});

  const courseFlow = coursePayload.flow;
  const totalFlowSteps = courseFlow.length;
  const currentStep = currentIndex + 1;
  const isLastStep = currentIndex === courseFlow.length - 1;

  const currentItem = useMemo(() => courseFlow[currentIndex], [courseFlow, currentIndex]);
  const currentThemeItems = useMemo(
    () => courseFlow.filter((item) => item.themeId === currentItem.themeId),
    [courseFlow, currentItem]
  );

  const currentThemeStep = useMemo(() => {
    const currentKey = getCourseItemKey(currentItem);
    const idx = currentThemeItems.findIndex((item) => getCourseItemKey(item) === currentKey);
    return idx === -1 ? 1 : idx + 1;
  }, [currentItem, currentThemeItems]);

  const currentLesson: CourseLessonItemDTO | null =
    currentItem.type === "lesson" ? currentItem : null;
  const currentLessonKey = currentLesson
    ? `${currentLesson.themeId}:${currentLesson.lessonId}`
    : null;
  const currentQuizQuestions = currentLesson?.quizQuestions ?? [];
  const hasQuizQuestions = currentQuizQuestions.length > 0;
  const shouldShowCompiler = Boolean(currentLesson && currentLesson.showCompiler !== false);
  const currentLessonAnswers = currentLessonKey
    ? lessonAnswers[currentLessonKey] ?? {}
    : {};
  const currentLessonCheckResult = currentLessonKey
    ? lessonCheckResults[currentLessonKey]
    : undefined;

  const activeThemeId = currentItem.themeId;
  const activeLessonId = currentItem.type === "lesson" ? currentItem.lessonId : undefined;

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

  const handleThemeSelect = (themeId: string) => {
    const index = courseFlow.findIndex(
      (item) => item.type === "theme" && item.themeId === themeId
    );
    if (index !== -1) setCurrentIndex(index);
  };

  const handleLessonSelect = (themeId: string, lessonId: string) => {
    const index = courseFlow.findIndex(
      (item) =>
        item.type === "lesson" &&
        item.themeId === themeId &&
        item.lessonId === lessonId
    );
    if (index !== -1) setCurrentIndex(index);
  };

  const handleQuestionAnswerChange = (questionId: string, values: string[]) => {
    if (!currentLessonKey) return;

    const normalizedValues = normalizeOptionIds(values);

    setLessonAnswers((prev) => ({
      ...prev,
      [currentLessonKey]: {
        ...(prev[currentLessonKey] ?? {}),
        [questionId]: normalizedValues,
      },
    }));

    setLessonCheckResults((prev) => {
      if (!(currentLessonKey in prev)) {
        return prev;
      }

      const next = { ...prev };
      delete next[currentLessonKey];
      return next;
    });
  };

  const handleCheckAnswers = () => {
    if (!currentLessonKey || !hasQuizQuestions) return;

    const result = buildLessonCheckResult(currentQuizQuestions, currentLessonAnswers);
    setLessonCheckResults((prev) => ({
      ...prev,
      [currentLessonKey]: result,
    }));
  };

  const handleNext = () => {
    if (isLastStep) return;
    setCurrentIndex((prev) => prev + 1);
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
          themes={coursePayload.themes.map((theme) => ({
            themeId: theme.themeId,
            title: theme.title,
            lessons: theme.lessons.map((lesson) => ({
              lessonId: lesson.lessonId,
              title: lesson.title,
            })),
          }))}
          activeThemeId={activeThemeId}
          activeLessonId={activeLessonId}
          onThemeSelect={handleThemeSelect}
          onLessonSelect={handleLessonSelect}
        />

        <main className={styles.content}>
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
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          <h1 className={styles.contentTitle}>{currentItem.title}</h1>
          <p className={styles.contentText}>{currentItem.text}</p>

          {currentLesson && (
            <div className={styles.practiceStack}>
              {shouldShowCompiler && (
                <div className={styles.compilerBlock}>
                  <PythonCompiler
                    key={`compiler-${currentLessonKey}`}
                    title="Практика в Python"
                    initialCode={currentLesson.compilerInitialCode ?? ""}
                  />
                </div>
              )}

              {hasQuizQuestions && (
                <section className={styles.quizBlock}>
                  <h2 className={styles.quizTitle}>Проверка по уроку</h2>

                  <div className={styles.questionsList}>
                    {currentQuizQuestions.map((question, index) => {
                      const selectedValues = currentLessonAnswers[question.id] ?? [];
                      const status = currentLessonCheckResult?.questionStatusById[question.id];
                      const statusClass =
                        status === "correct"
                          ? styles.questionStatusCorrect
                          : status === "incorrect"
                            ? styles.questionStatusIncorrect
                            : styles.questionStatusUnanswered;

                      return (
                        <article key={question.id} className={styles.questionCard}>
                          <div className={styles.questionMeta}>
                            <span className={styles.questionNumber}>Вопрос {index + 1}</span>
                            <span className={styles.questionType}>
                              {question.type === "single"
                                ? "Один вариант"
                                : "Несколько вариантов"}
                            </span>
                          </div>

                          {question.type === "single" ? (
                            <SingleChoice
                              name={`single-${currentLessonKey}-${question.id}`}
                              question={question.prompt}
                              options={question.options.map((option) => ({
                                value: option.id,
                                label: option.label,
                                description: option.description,
                                disabled: option.disabled,
                              }))}
                              value={selectedValues[0]}
                              onChange={(value) =>
                                handleQuestionAnswerChange(question.id, [value])
                              }
                            />
                          ) : (
                            <MultipleChoice
                              question={question.prompt}
                              options={question.options.map((option) => ({
                                value: option.id,
                                label: option.label,
                                description: option.description,
                                disabled: option.disabled,
                              }))}
                              values={selectedValues}
                              onChange={(values) =>
                                handleQuestionAnswerChange(question.id, values)
                              }
                            />
                          )}

                          {status && (
                            <p className={`${styles.questionStatus} ${statusClass}`}>
                              {status === "correct" && "Верно"}
                              {status === "incorrect" && "Неверно"}
                              {status === "unanswered" && "Нет ответа"}
                            </p>
                          )}

                          {status === "incorrect" && (
                            <p className={styles.correctAnswers}>
                              Правильный ответ: {getCorrectAnswersText(question)}
                            </p>
                          )}

                          {status && question.explanation && (
                            <p className={styles.questionExplanation}>{question.explanation}</p>
                          )}
                        </article>
                      );
                    })}
                  </div>

                  <div className={styles.quizActions}>
                    <Button
                      size="s"
                      variant="outline"
                      title="Проверить ответы"
                      onClick={handleCheckAnswers}
                    />

                    {currentLessonCheckResult && (
                      <p className={styles.quizSummary}>
                        Результат: {currentLessonCheckResult.score} из{" "}
                        {currentLessonCheckResult.total}
                      </p>
                    )}
                  </div>
                </section>
              )}
            </div>
          )}

          <div className={styles.nextButton}>
            <Button
              size="m"
              variant="filled"
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
