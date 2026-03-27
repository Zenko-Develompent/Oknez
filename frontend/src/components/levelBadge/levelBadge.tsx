import styles from "./levelBadge.module.css";

type LevelBadgeTone = "blue" | "orange";

interface LevelBadgeProps {
  level: number;
  tone?: LevelBadgeTone;
  className?: string;
}

export default function LevelBadge({
  level,
  tone = "blue",
  className = "",
}: LevelBadgeProps) {
  const toneClass = tone === "orange" ? styles.toneOrange : styles.toneBlue;
  const rootClassName = `${styles.badge} ${toneClass} ${className}`.trim();

  return (
    <div className={rootClassName}>
      <span>Уровень {level}</span>
    </div>
  );
}
