"use client";

import { useMemo, useState } from "react";
import Header from "@/components/header/header";
import Sidebar from "@/components/sidebar/sidebar";
import ButtonM from "@/components/buttonM/buttonM";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const isLastStep = currentIndex === COURSE_FLOW.length - 1;

  const currentItem = useMemo(() => COURSE_FLOW[currentIndex], [currentIndex]);

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
      router.push("/");
      return;
    }

    setCurrentIndex((prev) => prev + 1);
  };

  return (
    <div>
      <Header />
      <div className={styles.page}>
        <Sidebar
          totalSteps={50}
          completedSteps={5}
          isOpen={isSidebarOpen}
          onToggle={() => setIsSidebarOpen((prev) => !prev)}
          courseTitle="Основы цифровой грамотности и безопасного интернета"
          onThemeSelect={handleThemeSelect}
          onLessonSelect={handleLessonSelect}
        />

        <main className={styles.content}>
          <h1 className={styles.contentTitle}>{currentItem.title}</h1>
          <p className={styles.contentText}>{currentItem.text}</p>
          <div className={styles.nextButton}>
            <ButtonM title={isLastStep ? "В каталог" : "Дальше"} onClick={handleNext} />
          </div>
        </main>
      </div>
    </div>
  );
}
