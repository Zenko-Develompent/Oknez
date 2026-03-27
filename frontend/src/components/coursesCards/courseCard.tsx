import styles from "./courseCard.module.css";
import Link from "next/link";

interface CardProps {
  category: string;
  title: string;
  description?: string;
  detailsHref?: string;
  backgroundColor?: string;
  textColor?: string;
  descriptionColor?: string; // отдельный цвет для описания
  children?: React.ReactNode;
}

export default function Card({
  category,
  title,
  description,
  detailsHref = "/courseTheory",
  backgroundColor,
  textColor,
  descriptionColor,
  children,
}: CardProps) {
  const customStyle = {
    ...(backgroundColor && { backgroundColor }),
    ...(textColor && { color: textColor }),
  };

  const descriptionStyle = {
    ...(descriptionColor && { color: descriptionColor }),
  };

  return (
    <div className={styles.card} style={customStyle}>
      <span className={styles.category}>{category}</span>
      <h3 className={styles.title}>{title}</h3>
      {description && (
        <p className={styles.description} style={descriptionStyle}>
          {description}
        </p>
      )}
      <Link
        href={detailsHref}
        className={styles.button}
      >
        Просмотреть подробнее
      </Link>
      {children}
    </div>
  );
}
