"use client";

import { useMemo, useState } from "react";
import Header from "@/components/header/header";
import Sidebar from "@/components/sidebar/sidebar";
import Button from "@/components/button/button";
import styles from "./course.module.css";

type CourseItem =
  | {
      type: "theme";
      themeId: string;
      title: string;
      text: string;
    }
  | {
      type: "lesson";
      themeId: string;
      lessonId: string;
      title: string;
      text: string;
    };

const COURSE_FLOW: CourseItem[] = [
  {
    type: "theme",
    themeId: "theme-1",
    title: "Тема 1: Введение",
    text: "Описание темы 1. Здесь будет теория по базовым понятиям.",
  },
  {
    type: "lesson",
    themeId: "theme-1",
    lessonId: "lesson-1",
    title: "Задание: Тема 1, Урок 1",
    text: "Выполни задание для урока 1. Здесь будет текст задания.",
  },
  {
    type: "lesson",
    themeId: "theme-1",
    lessonId: "lesson-2",
    title: "Задание: Тема 1, Урок 2",
    text: "Выполни задание для урока 2. Здесь будет текст задания.",
  },
  {
    type: "theme",
    themeId: "theme-2",
    title: "Тема 2: Практика",
    text: "Описание темы 2. Здесь будет теория и примеры по теме.",
  },
  {
    type: "lesson",
    themeId: "theme-2",
    lessonId: "lesson-1",
    title: "Задание: Тема 2, Урок 1",
    text: "Выполни задание для урока 1 из второй темы.",
  },
  {
    type: "lesson",
    themeId: "theme-2",
    lessonId: "lesson-2",
    title: "Задание: Тема 2, Урок 2",
    text: "Выполни задание для урока 2 из второй темы.",
  },
];

export default function CourseTheoryPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const totalFlowSteps = COURSE_FLOW.length;
  const currentStep = currentIndex + 1;
  const isLastStep = currentIndex === COURSE_FLOW.length - 1;

  const currentItem = useMemo(() => COURSE_FLOW[currentIndex], [currentIndex]);
  const currentThemeItems = useMemo(
    () => COURSE_FLOW.filter((item) => item.themeId === currentItem.themeId),
    [currentItem]
  );
  const currentThemeStep = useMemo(() => {
    const idx = currentThemeItems.findIndex((item) => {
      if (item.type !== currentItem.type) return false;
      if (item.type === "theme" && currentItem.type === "theme") {
        return item.themeId === currentItem.themeId;
      }
      if (item.type === "lesson" && currentItem.type === "lesson") {
        return item.lessonId === currentItem.lessonId;
      }
      return false;
    });
    return idx === -1 ? 1 : idx + 1;
  }, [currentItem, currentThemeItems]);

  const handleThemeSelect = (themeId: string) => {
    const index = COURSE_FLOW.findIndex(
      (item) => item.type === "theme" && item.themeId === themeId
    );
    if (index !== -1) setCurrentIndex(index);
  };

  const handleLessonSelect = (themeId: string, lessonId: string) => {
    const index = COURSE_FLOW.findIndex(
      (item) =>
        item.type === "lesson" &&
        item.themeId === themeId &&
        item.lessonId === lessonId
    );
    if (index !== -1) setCurrentIndex(index);
  };

  const handleNext = () => {
    if (isLastStep) {
      return;
    }

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
          courseTitle="Основы цифровой грамотности и безопасного интернета"
          onThemeSelect={handleThemeSelect}
          onLessonSelect={handleLessonSelect}
        />

        <main className={styles.content}>
          <div className={styles.stepBanner}>
            <div className={styles.stepBannerTop}>Шаг {currentThemeStep} из {currentThemeItems.length}</div>
            <div className={styles.stepBannerBottom}>
              <div className={styles.stepSegments}>
                {currentThemeItems.map((item, index) => {
                  const key =
                    item.type === "theme"
                      ? `${item.themeId}-theme`
                      : `${item.themeId}-${item.lessonId}`;
                  return (
                    <span
                      key={key}
                      className={`${styles.stepSegment} ${
                        index + 1 === currentThemeStep ? styles.stepSegmentActive : ""
                      }`}
                    />
                  );
                })}
              </div>
            </div>
          </div>
          <h1 className={styles.contentTitle}>{currentItem.title}</h1>
          <p className={styles.contentText}>{currentItem.text}</p>
          <div className={styles.nextButton}>
            <Button size="m" variant="filled" fullWidth title={isLastStep ? "В каталог" : "Дальше"} onClick={handleNext} />
          </div>
        </main>
      </div>
    </div>
  );
}
