import { useId } from "react";
import type { InputHTMLAttributes } from "react";
import styles from "./input.module.css";

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "className"> {
  label: string;
  className?: string;
}

export default function Input({
  label,
  id,
  className = "",
  ...props
}: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <div className={`${styles.wrapper} ${className}`.trim()}>
      <label htmlFor={inputId} className={styles.label}>
        {label}
      </label>
      <input id={inputId} className={styles.input} {...props} />
    </div>
  );
}
