import Card from "@/components/coursesCards/courseCard";
import Header from "@/components/header/header";
import CoinIcon from "@/shared/assets/icons/coin.svg";
import HippoBronze from "@/shared/assets/images/hippobad.png";
import HippoGold from "@/shared/assets/images/hippogood.png";
import HippoSilver from "@/shared/assets/images/hipochild.png";
import styles from "./account.module.css";

interface AchievementItem {
  id: string;
  title?: string;
  image: string;
  alt: string;
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
    image: HippoGold.src,
    alt: "Золотой бегемоша",
  },
  {
    id: "silver",
    title: "«Серебряный навигатор»",
    image: HippoSilver.src,
    alt: "Серебряный бегемоша",
  },
  {
    id: "bronze",
    image: HippoBronze.src,
    alt: "Бронзовый бегемоша",
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

export default function AccountPage() {
  return (
    <div className={styles.page}>
      <Header />

      <main className={styles.content}>
        <section className={styles.profileSection}>
          <h1 className={styles.pageTitle}>Личный кабинет</h1>

          <p className={styles.coinsRow}>
            <span className={styles.coinsAmount}>4236</span>
            <img className={styles.coinIcon} src={CoinIcon.src} alt="" aria-hidden="true" />
          </p>

          <div className={styles.credentials}>
            <p>Логин: fwejhefijwen</p>
            <p>Пароль: fwejhefijwen</p>
          </div>
        </section>

        <section className={styles.section} id="allCourses">
          <h2 className={styles.sectionTitle}>Мои достижения</h2>

          <div className={styles.achievementsGrid}>
            {achievements.map((achievement) => (
              <article key={achievement.id} className={styles.achievementItem}>
                {achievement.title && <p className={styles.achievementLabel}>{achievement.title}</p>}
                <img src={achievement.image} alt={achievement.alt} className={styles.achievementImage} />
              </article>
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
      </main>
    </div>
  );
}