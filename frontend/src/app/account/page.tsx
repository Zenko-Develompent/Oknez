"use client";

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
import styles from "./account.module.css";

interface AchievementItem {
  id: string;
  title?: string;
  image: string;
  alt: string;
  level: number;
}

interface AccountCourse {
  id: string;
  category: string;
  title: string;
  progress: number;
  color: "blue" | "orange";
  lessonsDone: number;
  lessonsTotal: number;
}

const achievements: AchievementItem[] = [
  {
    id: "gold",
    title: "«Золотой повелитель»",
    image: AchivGold.src,
    alt: "Золотой бегемоша",
    level: 20,
  },
  {
    id: "silver",
    title: "«Серебряный навигатор»",
    image: AchivSilver.src,
    alt: "Серебряный бегемоша",
    level: 16,
  },
  {
    id: "bronze",
    title: "«Бронзовый чемпион»",
    image: AchivBronze.src,
    alt: "Бронзовый бегемоша",
    level: 12,
  },
];

const accountCourses: AccountCourse[] = [
  {
    id: "course-1",
    category: "Категория",
    title: "Название курса",
    progress: 86,
    color: "blue",
    lessonsDone: 6,
    lessonsTotal: 7,
  },
  {
    id: "course-2",
    category: "Категория",
    title: "Название курса",
    progress: 64,
    color: "orange",
    lessonsDone: 4,
    lessonsTotal: 7,
  },
  {
    id: "course-3",
    category: "Категория",
    title: "Название курса",
    progress: 86,
    color: "blue",
    lessonsDone: 6,
    lessonsTotal: 7,
  },
];

const coins = 4236;
const coinsPerLevel = 1000;
const level = Math.floor(coins / coinsPerLevel) + 1;
const levelProgress = Math.round(((coins % coinsPerLevel) / coinsPerLevel) * 100);
const coinsToNextLevel = coinsPerLevel - (coins % coinsPerLevel || coinsPerLevel);

export default function AccountPage() {
  return (
    <div className={styles.page}>
      <Header />

      <main className={styles.content}>
        <section className={styles.profileSection}>
          <h1 className={styles.pageTitle}>Личный кабинет</h1>
					<div className={styles.profileTopRow}>
						<p className={styles.coinsRow}>
							<span className={styles.coinsAmount}>{coins}</span>
							<img className={styles.coinIcon} src={CoinIcon.src} alt="" aria-hidden="true" />
						</p>
          
            <LevelBadge level={level} tone="orange" className={styles.levelBadge} />
          </div>

          <ProgressBar
            value={levelProgress}
            color="blue"
            label={`До уровня ${level + 1} осталось ${coinsToNextLevel} койна`}
            showValue={false}
            className={styles.coinsProgress}
          />

          <div className={styles.credentials}>
            <p>
              <span className={styles.credentialsLabel}>Логин:</span> fwejhefijwen
            </p>
            <p>
              <span className={styles.credentialsLabel}>Пароль:</span> fwejhefijwen
            </p>
          </div>
        </section>

        <section className={styles.section} id="allCourses">
          <h2 className={styles.sectionTitle}>Мои достижения</h2>

          <div className={styles.achievementsGrid}>
            {achievements.map((achievement) => (
              <AchievementCard
                key={achievement.id}
                title={achievement.title}
                image={achievement.image}
                alt={achievement.alt}
                level={achievement.level}
              />
            ))}
          </div>
        </section>

        <section className={styles.section} id="myCourses">
          <h2 className={styles.sectionTitle}>Продолжить обучение</h2>

          <div className={styles.coursesGrid}>
            {accountCourses.map((course) => (
              <Card
                key={course.id}
                category={course.category}
                title={course.title}
                description={`Прогресс: ${course.lessonsDone}/${course.lessonsTotal} уроков`}
                color={course.color}
                progress={course.progress}
                progressLabel="Прогресс курса"
              />
            ))}
          </div>
        </section>

        <div className={styles.bottomActions}>
          <Button
            title="Выйти из аккаунта"
            size="m"
            variant="outline"
            color="logo"
            className={styles.logoutButton}
            onClick={() => {
              window.location.href = "/login";
            }}
          />
        </div>
      </main>
    </div>
  );
}
