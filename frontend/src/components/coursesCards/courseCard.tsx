import Button from "@/components/button/button";
import ProgressBar from "@/components/progressBar/progressBar";
import styles from "./courseCard.module.css";

type CardColor = "blue" | "orange";

interface CardProps {
  category: string;
  title: string;
  description?: string;
  color?: CardColor;
  progress?: number;
  progressLabel?: string;
  children?: React.ReactNode;
}

export default function Card({
  category,
  title,
  description,
  color = "blue",
  progress,
  progressLabel,
  children,
}: CardProps) {
  const isBlue = color === "blue";
  const cardClass = isBlue ? styles.cardBlue : styles.cardOrange;
  const categoryClass = isBlue ? styles.categoryBlue : styles.categoryOrange;
  const buttonColor: CardColor = isBlue ? "blue" : "orange";

  return (
    <div className={`${styles.card} ${cardClass}`}>
      <span className={`${styles.category} ${categoryClass}`}>{category}</span>
      <h3 className={styles.title}>{title}</h3>
      {description && <p className={styles.description}>{description}</p>}

      {typeof progress === "number" && (
        <ProgressBar
          value={progress}
          color={buttonColor}
          label={progressLabel ?? "Прогресс курса"}
          className={styles.progress}
        />
      )}

      <Button
        title="Подробнее о курсе"
        size="m"
        variant="filled"
        color={buttonColor}
        fullWidth
        className={styles.button}
      />
      {children}
    </div>
  );
}