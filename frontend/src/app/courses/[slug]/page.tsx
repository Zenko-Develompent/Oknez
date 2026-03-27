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
  enrollCourse,
  getApiErrorMessage,
  getCourseById,
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
        const response = await getCourseById(courseId);

        if (cancelled) {
          return;
        }

        setCourse(response);
      } catch (error) {
        if (cancelled) {
          return;
        }

        if (error instanceof ApiError && error.status === 401) {
          router.replace("/login");
          return;
        }

        setErrorMessage(getApiErrorMessage(error, "Не удалось загрузить курс."));
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

  const tone = getToneByCategory(course?.category?.title ?? "");
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

      setErrorMessage(
        getApiErrorMessage(error, "Не удалось записаться на курс.")
      );
    } finally {
      setIsEnrolling(false);
    }
  };

  return (
    <div className={styles.page}>
      <Header />

      <section className={heroClass}>
        <div className={styles.heroText}>
          <span className={styles.categoryPill}>{course?.category?.title ?? "Курс"}</span>
          <h1 className={styles.title}>
            {course?.title ?? "Загрузка курса..."}
          </h1>
          <div className={styles.heroCtaWrap}>
            <button type="button" className={ctaClass} onClick={handleEnroll} disabled={isEnrolling || !courseId}>
              {isEnrolling ? "Записываем..." : "Поступить на курс!"}
            </button>
          </div>
        </div>

        <img
          className={styles.heroImage}
          src={tone === "blue" ? HippoBlue.src : HippoOrange.src}
          alt={course?.title ?? "Курс"}
        />
      </section>

      <main className={styles.content}>
        {isLoading && <p className={styles.loadingText}>Загружаем информацию о курсе...</p>}
        {errorMessage && <p className={styles.errorText}>{errorMessage}</p>}
        {statusMessage && <p className={styles.successText}>{statusMessage}</p>}

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>О курсе</h2>
          <p className={styles.paragraph}>
            {course?.description?.trim()
              ? course.description
              : "Описание курса пока не добавлено."}
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Текущий прогресс</h2>
          <p className={styles.paragraph}>
            {course?.progress_percent !== null && course?.progress_percent !== undefined
              ? `${Math.round(course.progress_percent)}%`
              : "Вы еще не начали этот курс."}
          </p>
        </section>

        <div className={styles.bottomCta}>
          <Link href="/" className={ctaClass}>
            Вернуться в каталог
          </Link>
        </div>
      </main>
    </div>
  );
}
