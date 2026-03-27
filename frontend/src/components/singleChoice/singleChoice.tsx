"use client";

import { useId } from "react";
import styles from "./singleChoice.module.css";

export interface SingleChoiceOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

interface SingleChoiceProps {
  name: string;
  options: SingleChoiceOption[];
  value?: string;
  question?: string;
  onChange: (value: string) => void;
  className?: string;
}

export default function SingleChoice({
  name,
  options,
  value,
  question,
  onChange,
  className = "",
}: SingleChoiceProps) {
  const groupId = useId();

  return (
    <fieldset className={`${styles.wrapper} ${className}`.trim()}>
      {question && <legend className={styles.question}>{question}</legend>}

      <div className={styles.options}>
        {options.map((option, index) => {
          const optionId = `${groupId}-${name}-${index}`;
          const isChecked = value === option.value;

          return (
            <label
              key={option.value}
              htmlFor={optionId}
              className={`${styles.option} ${
                option.disabled ? styles.optionDisabled : ""
              }`.trim()}
            >
              <input
                id={optionId}
                className={styles.optionInput}
                type="radio"
                name={name}
                value={option.value}
                checked={isChecked}
                disabled={option.disabled}
                onChange={() => onChange(option.value)}
              />

              <span aria-hidden className={styles.radio} />

              <span className={styles.texts}>
                <span className={styles.label}>{option.label}</span>
                {option.description && (
                  <span className={styles.description}>{option.description}</span>
                )}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
