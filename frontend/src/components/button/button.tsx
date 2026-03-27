import type { ButtonHTMLAttributes } from "react";
import styles from "./button.module.css";

type ButtonSize = "s" | "m";
type ButtonVariant = "filled" | "outline";
type ButtonColor = "blue" | "orange" | "logo" | "white";
type ButtonTextColor = "white" | "black";

interface ButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "children"
> {
  title: string;
  size?: ButtonSize;
  variant?: ButtonVariant;
  color?: ButtonColor;
  textColor?: ButtonTextColor;
  fullWidth?: boolean;
}

export default function Button({
  title,
  size = "m",
  variant = "filled",
  fullWidth = false,
  className = "",
  color = "logo",
  textColor = "black", // изменено с white на black
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
          "--button-text": textColor === "white" ? "#FFFFFF" : "#1a1a2e",
        };
      case "blue":
        return {
          "--button-bg": "var(--state-blue-default)",
          "--button-hover": "var(--state-blue-hoover)",
          "--button-active": "var(--state-blue-active)",
          "--button-disabled": "var(--state-blue-disabled)",
          "--button-text": textColor === "white" ? "#FFFFFF" : "#1a1a2e",
        };
      case "logo":
        return {
          "--button-bg": "var(--color-logo-default)",
          "--button-hover": "var(--color-logo-hoover)",
          "--button-active": "var(--color-logo-active)",
          "--button-disabled": "var(--color-logo-disabled)",
          "--button-text": textColor === "white" ? "#FFFFFF" : "#1a1a2e",
        };
      case "white":
        return {
          "--button-bg": "#FFFFFF",
          "--button-hover": "#F8FAFC",
          "--button-active": "#F1F5F9",
          "--button-disabled": "#F1F5F9",
          "--button-text": textColor === "white" ? "#FFFFFF" : "#1a1a2e",
        };
      default:
        return {
          "--button-bg": "var(--color-logo-default)",
          "--button-hover": "var(--color-logo-hoover)",
          "--button-active": "var(--color-logo-active)",
          "--button-disabled": "var(--color-logo-disabled)",
          "--button-text": textColor === "white" ? "#FFFFFF" : "#1a1a2e",
        };
    }
  };

  const colorVariables = getColorVariables();
  const sizeClass = size === "s" ? styles.sizeS : styles.sizeM;
  const variantClass = variant === "outline" ? styles.outline : styles.filled;
  const widthClass = fullWidth ? styles.fullWidth : "";
  const whiteClass = color === "white" ? styles.white : "";
  const textColorClass = textColor === "white" ? styles.whiteText : "";

  return (
    <button
      className={`${styles.button} ${sizeClass} ${variantClass} ${widthClass} ${whiteClass} ${textColorClass} ${className}`.trim()}
      style={colorVariables as React.CSSProperties}
      type={type}
      disabled={disabled}
      {...props}
    >
      {title}
    </button>
  );
}
