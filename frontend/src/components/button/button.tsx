import type { ButtonHTMLAttributes } from "react";
import styles from "./button.module.css";

type ButtonSize = "s" | "m";
type ButtonVariant = "filled" | "outline";
type ButtonColor = "blue" | "orange" | "logo" | "white";

interface ButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "children"
> {
  title: string;
  size?: ButtonSize;
  variant?: ButtonVariant;
  color?: ButtonColor;
  fullWidth?: boolean;
}

export default function Button({
  title,
  size = "m",
  variant = "filled",
  fullWidth = false,
  className = "",
  color = "logo",
  type = "button",
  disabled = false,
  ...props
}: ButtonProps) {
  // Устанавливаем CSS переменные для каждого цвета
  const getColorVariables = () => {
    switch (color) {
      case "orange":
        return {
          "--button-bg": "var(--state-orange-default)",
          "--button-hover": "var(--state-orange-hoover)",
          "--button-active": "var(--state-orange-active)",
          "--button-disabled": "var(--state-orange-disabled)",
        };
      case "blue":
        return {
          "--button-bg": "var(--state-blue-default)",
          "--button-hover": "var(--state-blue-hoover)",
          "--button-active": "var(--state-blue-active)",
          "--button-disabled": "var(--state-blue-disabled)",
        };
      case "logo":
        return {
          "--button-bg": "var(--color-logo-default)",
          "--button-hover": "var(--color-logo-hoover)",
          "--button-active": "var(--color-logo-active)",
          "--button-disabled": "var(--color-logo-disabled)",
        };
      case "white":
        return {
          "--button-bg": "#FFFFFF",
          "--button-hover": "#F8FAFC",
          "--button-active": "#F1F5F9",
          "--button-disabled": "#F1F5F9",
        };
      default:
        return {
          "--button-bg": "var(--color-logo-default)",
          "--button-hover": "var(--color-logo-hoover)",
          "--button-active": "var(--color-logo-active)",
          "--button-disabled": "var(--color-logo-disabled)",
        };
    }
  };

  const colorVariables = getColorVariables();
  const sizeClass = size === "s" ? styles.sizeS : styles.sizeM;
  const variantClass = variant === "outline" ? styles.outline : styles.filled;
  const widthClass = fullWidth ? styles.fullWidth : "";
  const whiteClass = color === "white" ? styles.white : "";

  return (
    <button
      className={`${styles.button} ${sizeClass} ${variantClass} ${widthClass} ${whiteClass} ${className}`.trim()}
      style={colorVariables as React.CSSProperties}
      type={type}
      disabled={disabled}
      {...props}
    >
      {title}
    </button>
  );
}
