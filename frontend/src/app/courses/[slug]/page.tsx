"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Header from "@/components/header/header";
import HippoBlue from "@/shared/assets/images/hippoblue.png";
import HippoOrange from "@/shared/assets/images/hippoorange.png";
import {
  ApiError,
  CourseDetailPublic,
  CoursePreviewPublic,
  CourseTreePublic,
  enrollCourse,
  getApiErrorMessage,
  getCourseById,
  getCourseTree,
  getHomeCourses,
} from "@/shared/api/client";
import { getAccessToken } from "@/shared/auth/tokens";
import styles from "./coursePage.module.css";

function getToneByCategory(categoryTitle?: string): "blue" | "orange" {
  if (!categoryTitle) {
    return "blue";
  }

  const normalized = categoryTitle.toLowerCase();

  if (normalized.includes("цифр") || normalized.includes("digital")) {
    return "orange";
  }

  return "blue";
}

export default function CoursePage() {
  const router = useRouter();
  const params = useParams<{ slug: string }>();
  const [course, setCourse] = useState<CourseDetailPublic | null>(null);
  const [courseTree, setCourseTree] = useState<CourseTreePublic | null>(null);
  const [fallbackCourse, setFallbackCourse] = useState<CoursePreviewPublic | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  const courseId = useMemo(() => {
    const parsedValue = Number(params?.slug ?? "");

    if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
      return null;
    }

    return parsedValue;
  }, [params?.slug]);

  const totalLessons = useMemo(
    () =>
      (courseTree?.modules ?? []).reduce(
        (count, module) =>
          count + module.topics.reduce((topicCount, topic) => topicCount + topic.tasks.length, 0),
        0
      ),
    [courseTree]
  );

  useEffect(() => {
    if (!courseId) {
      setErrorMessage("Некорректный идентификатор курса.");
      setIsLoading(false);
      return;
    }

    const accessToken = getAccessToken();

    if (!accessToken) {
      router.replace("/login");
      return;
    }

    let cancelled = false;

    const loadCourse = async () => {
      try {
        setIsLoading(true);
        const [courseResponse, treeResponse] = await Promise.all([
          getCourseById(courseId),
          getCourseTree(courseId),
        ]);

        if (cancelled) {
          return;
        }

        setCourse(courseResponse);
        setCourseTree(treeResponse);
        setFallbackCourse(null);
        setErrorMessage("");
      } catch (error) {
        if (cancelled) {
          return;
        }

        if (error instanceof ApiError && error.status === 401) {
          router.replace("/login");
          return;
        }

        try {
          const homeData = await getHomeCourses();
          const fallback =
            homeData.all_courses.find((item) => item.course_id === courseId) ??
            homeData.my_courses.find((item) => item.course_id === courseId) ??
            null;

          if (!cancelled) {
            setFallbackCourse(fallback);
            setCourseTree(null);
            setErrorMessage(
              fallback ? "" : getApiErrorMessage(error, "Не удалось загрузить курс.")
            );
          }
        } catch {
          if (!cancelled) {
            setErrorMessage(getApiErrorMessage(error, "Не удалось загрузить курс."));
          }
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadCourse();

    return () => {
      cancelled = true;
    };
  }, [courseId, router]);

  const tone = getToneByCategory(course?.category?.title ?? fallbackCourse?.category?.title ?? "");
  const heroClass = `${styles.hero} ${tone === "blue" ? styles.heroBlue : styles.heroOrange}`.trim();
  const ctaClass = `${styles.ctaButton} ${tone === "blue" ? styles.ctaBlue : styles.ctaOrange}`.trim();

  const handleEnroll = async () => {
    if (!courseId) {
      return;
    }

    setErrorMessage("");
    setStatusMessage("");

    try {
      setIsEnrolling(true);
      const response = await enrollCourse(courseId);
      setStatusMessage(response.message);
      router.push(`/courseTheory?courseId=${courseId}`);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        router.replace("/login");
        return;
      }

      setErrorMessage(getApiErrorMessage(error, "Не удалось записаться на курс."));
    } finally {
      setIsEnrolling(false);
    }
  };

  const descriptionText =
    course?.description?.trim() ||
    fallbackCourse?.description?.trim() ||
    "Описание курса пока не добавлено.";
  const progressPercent = course?.progress_percent ?? fallbackCourse?.progress_percent ?? null;

  return (
    <div className={styles.page}>
      <Header />

      <section className={heroClass}>
        <div className={styles.heroText}>
          <span className={styles.categoryPill}>
            {course?.category?.title ?? fallbackCourse?.category?.title ?? "Курс"}
          </span>
          <h1 className={styles.title}>
            {course?.title ?? fallbackCourse?.title ?? "Загрузка курса..."}
          </h1>
          <div className={styles.heroCtaWrap}>
            <button
              type="button"
              className={ctaClass}
              onClick={handleEnroll}
              disabled={isEnrolling || !courseId}
            >
              {isEnrolling ? "Записываем..." : "Поступить на курс!"}
            </button>
          </div>
        </div>

        <img
          className={styles.heroImage}
          src={tone === "blue" ? HippoBlue.src : HippoOrange.src}
          alt={course?.title ?? fallbackCourse?.title ?? "Курс"}
        />
      </section>

      <main className={styles.content}>
        {isLoading && <p className={styles.loadingText}>Загружаем информацию о курсе...</p>}
        {errorMessage && <p className={styles.errorText}>{errorMessage}</p>}
        {statusMessage && <p className={styles.successText}>{statusMessage}</p>}

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>О курсе</h2>
          <p className={styles.paragraph}>{descriptionText}</p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Текущий прогресс</h2>
          <p className={styles.paragraph}>
            {progressPercent !== null && progressPercent !== undefined
              ? `${Math.round(progressPercent)}%`
              : "Вы ещё не начали этот курс."}
          </p>
        </section>

        {courseTree && (
          <>
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Программа курса</h2>
              <p className={styles.paragraph}>
                Всего уроков: {totalLessons}. Программа подгружается только с сервера.
              </p>
              <div className={styles.programGrid}>
                {courseTree.modules.map((module) => (
                  <article key={module.id} className={styles.programCard}>
                    <h3 className={styles.programCardTitle}>{module.title}</h3>
                    <p className={styles.programCardDescription}>
                      {module.description?.trim() || "Описание модуля не добавлено."}
                    </p>
                    <ul className={styles.programThemeList}>
                      {module.topics.map((theme) => (
                        <li key={theme.id}>
                          {theme.title} · уроков: {theme.tasks.length}
                        </li>
                      ))}
                    </ul>
                  </article>
                ))}
              </div>
            </section>
          </>
        )}

        <div className={styles.bottomCta}>
          <Link href="/" className={ctaClass}>
            Вернуться в каталог
          </Link>
        </div>
      </main>
    </div>
  );
}
