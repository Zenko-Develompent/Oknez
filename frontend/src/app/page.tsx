"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/coursesCards/courseCard";
import Button from "@/components/button/button";
import Header from "@/components/header/header";
import HipoImg from "@/shared/assets/images/hipocatalog.png";
import {
  ApiError,
  CoursePreviewPublic,
  HomeCoursesResponse,
  getApiErrorMessage,
  getHomeCourses,
} from "@/shared/api/client";
import { getAccessToken } from "@/shared/auth/tokens";
import styles from "./page.module.css";

const ALL_FILTER = "Все курсы";

interface CatalogCourse {
  id: string;
  category: string;
  title: string;
  progress: number;
  color: "blue" | "orange";
  buttonHref: string;
  buttonTitle?: string;
}

function getCourseColor(category: string, index: number): "blue" | "orange" {
  const normalized = category.toLowerCase();

  if (normalized.includes("цифр") || normalized.includes("digital")) {
    return "orange";
  }

  return index % 2 === 0 ? "blue" : "orange";
}

function mapCourse(
  course: CoursePreviewPublic,
  index: number,
  enrolledCourseIds: Set<number>
): CatalogCourse {
  const category = course.category?.title ?? "Без категории";
  const isEnrolled = enrolledCourseIds.has(course.course_id) || course.progress_percent > 0;

  return {
    id: String(course.course_id),
    category,
    title: course.title,
    progress: course.progress_percent,
    color: getCourseColor(category, index),
    buttonHref: `/courses/${course.course_id}`,
    buttonTitle: isEnrolled ? "Продолжить курс" : "Поступить на курс!",
  };
}

function filterCourses(courses: CatalogCourse[], selectedFilter: string): CatalogCourse[] {
  if (selectedFilter === ALL_FILTER) {
    return courses;
  }

  return courses.filter((course) => course.category === selectedFilter);
}

function getFilterButtonColor(index: number): "logo" | "blue" | "orange" {
  if (index === 0) {
    return "logo";
  }

  return index % 2 === 0 ? "orange" : "blue";
}

export default function Home() {
  const router = useRouter();
  const [homeData, setHomeData] = useState<HomeCoursesResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [myFilter, setMyFilter] = useState(ALL_FILTER);
  const [allFilter, setAllFilter] = useState(ALL_FILTER);

  useEffect(() => {
    const accessToken = getAccessToken();

    if (!accessToken) {
      router.replace("/login");
      return;
    }

    let cancelled = false;

    const loadHomeData = async () => {
      try {
        setIsLoading(true);
        const response = await getHomeCourses();

        if (cancelled) {
          return;
        }

        setHomeData(response);
      } catch (error) {
        if (cancelled) {
          return;
        }

        if (error instanceof ApiError && error.status === 401) {
          router.replace("/login");
          return;
        }

        setErrorMessage(getApiErrorMessage(error, "Не удалось загрузить список курсов."));
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadHomeData();

    return () => {
      cancelled = true;
    };
  }, [router]);

  const myCourseIds = useMemo(() => {
    const ids = new Set<number>();

    for (const course of homeData?.my_courses ?? []) {
      ids.add(course.course_id);
    }

    return ids;
  }, [homeData]);

  const myCourses = useMemo(
    () =>
      (homeData?.my_courses ?? []).map((course, index) =>
        mapCourse(course, index, myCourseIds)
      ),
    [homeData, myCourseIds]
  );

  const allCourses = useMemo(
    () =>
      (homeData?.all_courses ?? []).map((course, index) =>
        mapCourse(course, index, myCourseIds)
      ),
    [homeData, myCourseIds]
  );

  const filters = useMemo(() => {
    const categories = new Set<string>();

    for (const course of [...myCourses, ...allCourses]) {
      categories.add(course.category);
    }

    return [ALL_FILTER, ...Array.from(categories)];
  }, [allCourses, myCourses]);

  useEffect(() => {
    if (!filters.includes(myFilter)) {
      setMyFilter(ALL_FILTER);
    }

    if (!filters.includes(allFilter)) {
      setAllFilter(ALL_FILTER);
    }
  }, [allFilter, filters, myFilter]);

  const filteredMyCourses = useMemo(
    () => filterCourses(myCourses, myFilter),
    [myCourses, myFilter]
  );
  const filteredAllCourses = useMemo(
    () => filterCourses(allCourses, allFilter),
    [allCourses, allFilter]
  );

  return (
    <div>
      <Header />
      <div className={styles.main}>
        <div className={styles.aboutus}>
          <div className={styles.imageHipo}>
            <img src={HipoImg.src} alt="" />
          </div>
          <div className={styles.description}>
            <h2 className={styles.title} id="aboutPlatform">
              О платформе
            </h2>
            <p className={styles.text}>
              Знакомьтесь, это Бегемоша - самый умный и добрый бегемот в мире программирования!
              <br />
              Он помогает детям делать первые шаги в IT.
              <br />
              Вместе с Бегемошей ваш ребенок научится писать настоящий код.
              <br />
              И все это в игровой форме, без скучных правил и сложных терминов.
            </p>
          </div>
        </div>

        {isLoading && <p className={styles.statusText}>Загружаем курсы...</p>}
        {errorMessage && <p className={styles.errorText}>{errorMessage}</p>}

        <div className={styles.my_filter_wrapper}>
          <div className={styles.my_title_wrapper}>
            <h2 className={styles.my_title_filter} id="myCourses">
              Мои курсы
            </h2>
          </div>
          <div className={styles.filters}>
            {filters.map((filter, index) => {
              const isActive = myFilter === filter;
              return (
                <Button
                  key={`my-${filter}`}
                  size="m"
                  variant={isActive ? "filled" : "outline"}
                  color={getFilterButtonColor(index)}
                  title={filter}
                  onClick={() => setMyFilter(filter)}
                />
              );
            })}
          </div>
        </div>

        <div className={styles.my_card_wrapper}>
          {filteredMyCourses.map((course) => (
            <Card
              key={course.id}
              category={course.category}
              title={course.title}
              description={`Прогресс: ${Math.round(course.progress)}%`}
              color={course.color}
              progress={course.progress}
              progressLabel="Прогресс курса"
              buttonHref={course.buttonHref}
              buttonTitle={course.buttonTitle}
            />
          ))}
        </div>

        <div className={styles.my_filter_wrapper}>
          <div className={styles.my_title_wrapper}>
            <h2 className={styles.my_title_filter} id="allCourses">
              Все курсы
            </h2>
          </div>
          <div className={styles.filters}>
            {filters.map((filter, index) => {
              const isActive = allFilter === filter;
              return (
                <Button
                  key={`all-${filter}`}
                  size="m"
                  variant={isActive ? "filled" : "outline"}
                  color={getFilterButtonColor(index)}
                  title={filter}
                  onClick={() => setAllFilter(filter)}
                />
              );
            })}
          </div>
        </div>

        <div className={styles.my_card_wrapper}>
          {filteredAllCourses.map((course) => (
            <Card
              key={course.id}
              category={course.category}
              title={course.title}
              description={`Прогресс: ${Math.round(course.progress)}%`}
              color={course.color}
              progress={course.progress}
              progressLabel="Прогресс курса"
              buttonHref={course.buttonHref}
              buttonTitle={course.buttonTitle}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
