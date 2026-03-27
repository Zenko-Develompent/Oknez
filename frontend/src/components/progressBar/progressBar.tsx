import styles from "./progressBar.module.css";

type ProgressBarColor = "blue" | "orange";

interface ProgressBarProps {
  value: number;
  color?: ProgressBarColor;
  className?: string;
  label?: string;
  showValue?: boolean;
}

function normalizeValue(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(100, Math.max(0, Math.round(value)));
}

export default function ProgressBar({
  value,
  color = "blue",
  className = "",
  label = "Прогресс",
  showValue = true,
}: ProgressBarProps) {
  const normalizedValue = normalizeValue(value);
  const fillClass = color === "orange" ? styles.fillOrange : styles.fillBlue;
  const rootClassName = `${styles.wrapper} ${className}`.trim();

  return (
    <div className={rootClassName}>
      {(label || showValue) && (
        <div className={styles.meta}>
          {label && <span className={styles.label}>{label}</span>}
          {showValue && <span className={styles.value}>{normalizedValue}%</span>}
        </div>
      )}

      <div
        className={styles.track}
        role="progressbar"
        aria-label={label || "Прогресс"}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={normalizedValue}
      >
        <span className={`${styles.fill} ${fillClass}`} style={{ width: `${normalizedValue}%` }} />
      </div>
    </div>
  );
}