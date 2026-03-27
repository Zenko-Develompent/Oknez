import styles from "./courseCard.module.css";

interface CardProps {
  category: string;
  title: string;
  description?: string;
  backgroundColor?: string;
  textColor?: string;
  descriptionColor?: string; // отдельный цвет для описания
  children?: React.ReactNode;
}

export default function Card({
  category,
  title,
  description,
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
      <span className={styles.button}
      >
        Просмотреть подробнее
      </span>
      {children}
    </div>
  );
}
