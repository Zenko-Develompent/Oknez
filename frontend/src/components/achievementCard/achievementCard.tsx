import LevelBadge from "@/components/levelBadge/levelBadge";
import styles from "./achievementCard.module.css";

interface AchievementCardProps {
  title?: string;
  image: string;
  alt: string;
  level: number;
  className?: string;
}

export default function AchievementCard({
  title,
  image,
  alt,
  level,
  className = "",
}: AchievementCardProps) {
  const rootClassName = `${styles.card} ${className}`.trim();

  return (
    <article className={rootClassName}>
      {title && <p className={styles.title}>{title}</p>}
      <img src={image} alt={alt} className={styles.image} />
      <LevelBadge level={level} tone="orange" className={styles.level} />
    </article>
  );
}
