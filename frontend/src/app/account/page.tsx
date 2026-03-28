"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/button/button";
import AchievementCard from "@/components/achievementCard/achievementCard";
import Card from "@/components/coursesCards/courseCard";
import Header from "@/components/header/header";
import LevelBadge from "@/components/levelBadge/levelBadge";
import ProgressBar from "@/components/progressBar/progressBar";
import CoinIcon from "@/shared/assets/icons/coin.svg";
import AchivBronze from "@/shared/assets/images/achivbronze.png";
import AchivGold from "@/shared/assets/images/achivhold.png";
import AchivSilver from "@/shared/assets/images/achivsilver.png";
import {
  AchievementPublic,
  ApiError,
  CoursePreviewPublic,
  UserAchievementPublic,
  UserCoursePublic,
  UserPublic,
  getAllAchievements,
  getApiErrorMessage,
  getHomeCourses,
  getMyAchievements,
  getMyProfile,
} from "@/shared/api/client";
import { clearTokens, getAccessToken } from "@/shared/auth/tokens";
import styles from "./account.module.css";

const XP_PER_LEVEL = 100;
const fallbackAchievementImages = [AchivGold.src, AchivSilver.src, AchivBronze.src];

function getCourseColor(category: string, index: number): "blue" | "orange" {
  const normalized = category.toLowerCase();

  if (normalized.includes("цифр") || normalized.includes("digital")) {
    return "orange";
  }

  return index % 2 === 0 ? "blue" : "orange";
}

function mapProfileCourse(course: UserCoursePublic): CoursePreviewPublic {
  return {
    course_id: course.course_id,
    title: course.title,
    description: course.description,
    progress_percent: course.progress_percent,
    category: course.category,
  };
}

function getAchievementImage(iconUrl: string | null, index: number): string {
  if (iconUrl && iconUrl.trim()) {
    return iconUrl;
  }

  return fallbackAchievementImages[index % fallbackAchievementImages.length];
}

export default function AccountPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserPublic | null>(null);
  const [myAchievements, setMyAchievements] = useState<UserAchievementPublic[]>([]);
  const [allAchievements, setAllAchievements] = useState<AchievementPublic[]>([]);
  const [myCourses, setMyCourses] = useState<CoursePreviewPublic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const accessToken = getAccessToken();

    if (!accessToken) {
      router.replace("/login");
      return;
    }

    let cancelled = false;

    const loadData = async () => {
      try {
        setIsLoading(true);
        const [
          profileResponse,
          homeCoursesResponse,
          myAchievementsResponse,
          allAchievementsResponse,
        ] =
          await Promise.all([
            getMyProfile(),
            getHomeCourses(),
            getMyAchievements(),
            getAllAchievements(),
          ]);

        if (cancelled) {
          return;
        }

        setProfile(profileResponse);
        setMyAchievements(myAchievementsResponse);
        setAllAchievements(allAchievementsResponse);

        const myCoursesFromHome = homeCoursesResponse.my_courses ?? [];
        const myCoursesFromProfile = Array.isArray(profileResponse.courses)
          ? profileResponse.courses.map(mapProfileCourse)
          : [];

        const mergedById = new Map<number, CoursePreviewPublic>();

        for (const course of [...myCoursesFromProfile, ...myCoursesFromHome]) {
          mergedById.set(course.course_id, course);
        }

        setMyCourses(Array.from(mergedById.values()));
      } catch (error) {
        if (cancelled) {
          return;
        }

        if (error instanceof ApiError && error.status === 401) {
          clearTokens();
          router.replace("/login");
          return;
        }

        setErrorMessage(getApiErrorMessage(error, "Не удалось загрузить данные аккаунта."));
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadData();

    return () => {
      cancelled = true;
    };
  }, [router]);

  const fullName = profile
    ? `${profile.first_name}${profile.last_name ? ` ${profile.last_name}` : ""}`
    : "Пользователь";
  const totalXp = profile?.total_xp ?? 0;
  const level = profile?.level ?? 1;
  const currentLevelXp = totalXp % XP_PER_LEVEL;
  const levelProgress = Math.round((currentLevelXp / XP_PER_LEVEL) * 100);
  const xpToNextLevel = XP_PER_LEVEL - currentLevelXp || XP_PER_LEVEL;
  const ownedAchievementIds = useMemo(() => {
    const ids = new Set<number>();

    for (const achievement of myAchievements) {
      ids.add(achievement.id);
    }

    return ids;
  }, [myAchievements]);

  return (
    <div className={styles.page}>
      <Header />

      <main className={styles.content}>
        <section className={styles.profileSection}>
          <h1 className={styles.pageTitle}>Личный кабинет</h1>

          <div className={styles.profileTopRow}>
            <p className={styles.fullName}>{fullName}</p>
            <LevelBadge level={level} tone="orange" className={styles.levelBadge} />
          </div>

          <div className={styles.balanceRow}>
            <p className={styles.balanceLabel}>Баланс:</p>
            <p className={styles.coinsRow}>
              <span className={styles.coinsAmount}>{totalXp}</span>
              <img className={styles.coinIcon} src={CoinIcon.src} alt="" aria-hidden="true" />
            </p>
          </div>

          <ProgressBar
            value={levelProgress}
            color="blue"
            label={`До уровня ${level + 1} осталось ${xpToNextLevel} XP`}
            showValue={false}
            className={styles.coinsProgress}
          />
        </section>

        {isLoading && <p className={styles.statusText}>Загружаем данные кабинета...</p>}
        {errorMessage && <p className={styles.errorText}>{errorMessage}</p>}

        <section className={styles.section}>
          <h2 className={styles.allAchievementsTitle}>Все достижения</h2>

          <div className={styles.allAchievementsGrid}>
            {allAchievements.map((achievement, index) => (
              <AchievementCard
                key={`all-${achievement.id}`}
                title={achievement.title}
                image={getAchievementImage(achievement.icon_url, index)}
                alt={achievement.title}
                level={achievement.xp_reward}
                className={ownedAchievementIds.has(achievement.id) ? "" : styles.grayscaleAchievement}
              />
            ))}
          </div>
        </section>

        <section className={styles.section} id="myCourses">
          <h2 className={styles.sectionTitle}>Продолжить обучение</h2>

          <div className={styles.coursesGrid}>
            {myCourses.map((course, index) => (
              <Card
                key={course.course_id}
                category={course.category?.title ?? "Без категории"}
                title={course.title}
                description={`Прогресс: ${Math.round(course.progress_percent)}%`}
                color={getCourseColor(course.category?.title ?? "", index)}
                progress={course.progress_percent}
                progressLabel="Прогресс курса"
                buttonHref={`/courses/${course.course_id}`}
                buttonTitle="Открыть курс"
              />
            ))}
          </div>
          {myCourses.length === 0 && (
            <p className={styles.statusText}>Пока нет начатых курсов. Выбери курс в каталоге.</p>
          )}
        </section>

        <div className={styles.bottomActions}>
          <Button
            title="Выйти из аккаунта"
            size="m"
            variant="outline"
            color="logo"
            className={styles.logoutButton}
            onClick={() => {
              clearTokens();
              router.push("/login");
            }}
          />
        </div>
      </main>
    </div>
  );
}
