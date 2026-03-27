import { title } from "process";
import styles from "./buttonS.module.css";

interface ButtonProps {
	title: string;
}

export default function ButtonS({title}: ButtonProps) {
	return (
		<button className={styles.button}>
			{title}
		</button>
	);
}