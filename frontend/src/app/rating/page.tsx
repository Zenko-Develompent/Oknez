"use client";

import { useEffect, useState } from "react";
import Header from "@/components/header/header";
import LevelBadge from "@/components/levelBadge/levelBadge";
import CoinIcon from "@/shared/assets/icons/coin.svg";
import { getApiErrorMessage, getMyProfile, getRatingTop, RatingUserPublic } from "@/shared/api/client";
import { getAccessToken } from "@/shared/auth/tokens";
import styles from "./rating.module.css";

export default function RatingPage() {
  const [topStudents, setTopStudents] = useState<RatingUserPublic[]>([]);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      try {
        setIsLoading(true);
        const accessToken = getAccessToken();

        const [rating, profile] = await Promise.all([
          getRatingTop(10),
          accessToken ? getMyProfile().catch(() => null) : Promise.resolve(null),
        ]);

        if (cancelled) {
          return;
        }

        setTopStudents(rating);
        setCurrentUserId(profile?.id ?? null);
      } catch (error) {
        if (cancelled) {
          return;
        }

        setErrorMessage(getApiErrorMessage(error, "Не удалось загрузить рейтинг."));
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
  }, []);

  const currentUserPosition =
    currentUserId === null
      ? -1
      : topStudents.findIndex((student) => student.user_id === currentUserId) + 1;

  const getWinnerClass = (index: number): string => {
    if (index === 0) return styles.winnerGold;
    if (index === 1) return styles.winnerSilver;
    if (index === 2) return styles.winnerBronze;
    return "";
  };

  return (
    <div className={styles.page}>
      <Header />

      <main className={styles.content}>
        <h1 className={styles.title}>Топ учеников</h1>
        <p className={styles.subtitle}>
          Рейтинг обновляется по количеству заработанных XP.
        </p>
        <p className={styles.userPosition}>
          Твоя позиция:{" "}
          <strong className={styles.userPositionValue}>
            {currentUserPosition > 0
              ? `${currentUserPosition} место`
              : currentUserId
                ? "вне топ-10"
                : "не определена"}
          </strong>
        </p>

        {isLoading && <p className={styles.statusText}>Загружаем рейтинг...</p>}
        {errorMessage && <p className={styles.errorText}>{errorMessage}</p>}

        <ol className={styles.list}>
          {topStudents.map((student, index) => (
            <li
              key={student.user_id}
              className={`${styles.row} ${getWinnerClass(index)} ${
                student.user_id === currentUserId ? styles.rowCurrentUser : ""
              }`.trim()}
            >
              <span className={`${styles.place} ${getWinnerClass(index)}`.trim()}>
                {index + 1}
              </span>

              <div className={styles.studentInfo}>
                <p className={styles.studentName}>
                  {student.first_name}
                  {student.last_name ? ` ${student.last_name}` : ""}
                </p>
                <LevelBadge
                  level={student.level}
                  tone="orange"
                  className={styles.studentLevelBadge}
                />
              </div>

              <p className={styles.coins}>
                <span>{student.total_xp}</span>
                <img src={CoinIcon.src} alt="" aria-hidden="true" />
              </p>
            </li>
          ))}
        </ol>
      </main>
    </div>
  );
}
