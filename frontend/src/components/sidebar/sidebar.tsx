'use client'

import styles from "./sidebar.module.css";
import CoinIcon from "@/shared/assets/icons/coin.svg";

interface SidebarProps {
  totalSteps: number;
  completedSteps: number;
  isOpen: boolean;
  onToggle: () => void;
  courseTitle?: string;
  onThemeSelect: (themeId: string) => void;
  onLessonSelect: (themeId: string, lessonId: string) => void;
}

export default function Sidebar({
  totalSteps,
  completedSteps,
  isOpen,
  onToggle,
  courseTitle = "Название",
  onThemeSelect,
  onLessonSelect,
}: SidebarProps) {
  const safeTotalSteps = Math.max(totalSteps, 1);
  const safeCompletedSteps = Math.min(Math.max(completedSteps, 0), safeTotalSteps);
  const progressPercent = Math.round((safeCompletedSteps / safeTotalSteps) * 100);

  return (
    <aside className={`${styles.wrapper} ${!isOpen ? styles.collapsed : ""}`}>
      <button
        type="button"
        className={styles.toggleButton}
        onClick={onToggle}
        aria-label={isOpen ? "Свернуть сайдбар" : "Открыть сайдбар"}
      >
        {isOpen ? ">" : "<"}
      </button>

      <div className={styles.sidebarBody}>
        <h2 className={styles.title2}>{courseTitle}</h2>
        <h3 className={styles.title3}>
          Шаг {safeCompletedSteps} из {safeTotalSteps}
        </h3>
        <div className={styles.coinsRow}>
          <span className={styles.coinsText}>
            Получено {safeCompletedSteps} из {safeTotalSteps}
          </span>
          <img className={styles.coinIcon} src={CoinIcon.src} alt="Монета" />
        </div>
        <h3 className={styles.title3}>Прогресс</h3>

        <div className={styles.progressTrack}>
          <div className={styles.progressFill} style={{ width: `${progressPercent}%` }} />
        </div>

        <h3 className={`${styles.title3} ${styles.modulesTitle}`}>Модули</h3>

        <div className={styles.module}>
          <ul className={styles.themeList}>
            <li className={styles.themeItem}>
              <button
                type="button"
                className={styles.themeButton}
                onClick={() => onThemeSelect("theme-1")}
              >
                Тема 1
              </button>
              <ul className={styles.lessonList}>
                <li>
                  <button
                    type="button"
                    className={styles.lessonButton}
                    onClick={() => onLessonSelect("theme-1", "lesson-1")}
                  >
                    Урок 1
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    className={styles.lessonButton}
                    onClick={() => onLessonSelect("theme-1", "lesson-2")}
                  >
                    Урок 2
                  </button>
                </li>
              </ul>
            </li>

            <li className={styles.themeItem}>
              <button
                type="button"
                className={styles.themeButton}
                onClick={() => onThemeSelect("theme-2")}
              >
                Тема 2
              </button>
              <ul className={styles.lessonList}>
                <li>
                  <button
                    type="button"
                    className={styles.lessonButton}
                    onClick={() => onLessonSelect("theme-2", "lesson-1")}
                  >
                    Урок 1
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    className={styles.lessonButton}
                    onClick={() => onLessonSelect("theme-2", "lesson-2")}
                  >
                    Урок 2
                  </button>
                </li>
              </ul>
            </li>
          </ul>
        </div>
      </div>
    </aside>
  );
}
