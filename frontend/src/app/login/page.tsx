"use client";

import Input from "@/components/input/input";
import ButtoM from "@/components/buttonM/buttonM";
import HipoLogin from "@/shared/assets/images/hipilogin.png";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "./login.module.css";

export default function LoginPage() {
  const router = useRouter();

  return (
    <div className={styles.main}>
      <div className={styles.loginWindow}>
        <div className={styles.leftPane}>
          <img className={styles.heroImage} src={HipoLogin.src} alt="Бегемоша" />
        </div>

        <div className={styles.forms}>
          <h1 className={styles.title}>Вход</h1>

					<Input 
						label="Логин"
						placeholder="Введите email"
						type="email"
					/>

          <Input 
            label="Пароль"
            placeholder="Введите пароль"
            type="password"
          />

					<ButtoM 
						title="Войти"
						onClick={() => router.push("/")}
					/>

          <p className={styles.registerText}>
            Еще нет аккаунта?{" "}
            <Link href="/registration" className={styles.registerLink}>
              Создать аккаунт
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
