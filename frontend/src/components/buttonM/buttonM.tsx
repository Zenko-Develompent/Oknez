import styles from "./buttonM.module.css";

interface ButtonProps {
  title: string;
  type?: "button" | "submit" | "reset";
  onClick?: () => void;
}

export default function ButtonM({ title, type = "button", onClick }: ButtonProps) {
  return (
    <button className={styles.button} type={type} onClick={onClick}>
      {title}
    </button>
  );
}
