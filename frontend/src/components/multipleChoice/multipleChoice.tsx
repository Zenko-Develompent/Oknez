"use client";

import { useId } from "react";
import styles from "./multipleChoice.module.css";

export interface MultipleChoiceOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

interface MultipleChoiceProps {
  options: MultipleChoiceOption[];
  values: string[];
  question?: string;
  onChange: (values: string[]) => void;
  className?: string;
}

export default function MultipleChoice({
  options,
  values,
  question,
  onChange,
  className = "",
}: MultipleChoiceProps) {
  const groupId = useId();

  const handleToggle = (value: string) => {
    const isSelected = values.includes(value);
    if (isSelected) {
      onChange(values.filter((item) => item !== value));
      return;
    }
    onChange([...values, value]);
  };

  return (
    <fieldset className={`${styles.wrapper} ${className}`.trim()}>
      {question && <legend className={styles.question}>{question}</legend>}

      <div className={styles.options}>
        {options.map((option, index) => {
          const optionId = `${groupId}-${index}`;
          const isChecked = values.includes(option.value);

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
                type="checkbox"
                value={option.value}
                checked={isChecked}
                disabled={option.disabled}
                onChange={() => handleToggle(option.value)}
              />

              <span aria-hidden className={styles.checkbox} />

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
