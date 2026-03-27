import type { ButtonHTMLAttributes } from "react";
import styles from "./button.module.css";

type ButtonSize = "s" | "m";
type ButtonVariant = "filled" | "outline";

interface ButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "children"
> {
  title: string;
  size?: ButtonSize;
  variant?: ButtonVariant;
  backgroundColor?: string; //допилил прокидку цвета бг через пропс
  fullWidth?: boolean;
}

export default function Button({
  title,
  size = "m",
  variant = "filled",
  fullWidth = false,
  className = "",
  backgroundColor,
  type = "button",
  ...props
}: ButtonProps) {
  // Просто передаем цвет напрямую
  const customStyle = backgroundColor ? { backgroundColor } : {};

  const sizeClass = size === "s" ? styles.sizeS : styles.sizeM;
  const variantClass = variant === "outline" ? styles.outline : styles.filled;
  const widthClass = fullWidth ? styles.fullWidth : "";

  return (
    <button
      className={`${styles.button} ${sizeClass} ${variantClass} ${widthClass} ${className}`.trim()}
      style={customStyle}
      type={type}
      {...props}
    >
      {title}
    </button>
  );
}
