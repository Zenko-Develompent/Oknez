import type { ButtonHTMLAttributes } from "react";
import styles from "./button.module.css";

type ButtonSize = "s" | "m";
type ButtonVariant = "filled" | "outline";

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  title: string;
  size?: ButtonSize;
  variant?: ButtonVariant;
  fullWidth?: boolean;
}

export default function Button({
  title,
  size = "m",
  variant = "filled",
  fullWidth = false,
  className = "",
  type = "button",
  ...props
}: ButtonProps) {
  const sizeClass = size === "s" ? styles.sizeS : styles.sizeM;
  const variantClass = variant === "outline" ? styles.outline : styles.filled;
  const widthClass = fullWidth ? styles.fullWidth : "";

  return (
    <button
      className={`${styles.button} ${sizeClass} ${variantClass} ${widthClass} ${className}`.trim()}
      type={type}
      {...props}
    >
      {title}
    </button>
  );
}
