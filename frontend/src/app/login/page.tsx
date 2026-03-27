"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Input from "@/components/input/input";
import Button from "@/components/button/button";
import HipoLogin from "@/shared/assets/images/hipilogin.png";
import HandIcon from "@/shared/assets/icons/hand.svg";
import { getApiErrorMessage, loginUser } from "@/shared/api/client";
import { setTokens } from "@/shared/auth/tokens";
import styles from "./login.module.css";

export default function LoginPage() {
  const router = useRouter();
  const [mail, setMail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");

    if (!mail.trim() || !password) {
      setErrorMessage("Заполни email и пароль.");
      return;
    }

    try {
      setIsSubmitting(true);
      const tokens = await loginUser({
        mail: mail.trim(),
        password,
      });

      setTokens(tokens.access_token, tokens.refresh_token);
      router.push("/");
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "Не удалось войти в аккаунт."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.main}>
      <div className={styles.titlelogo}>Бегемоша</div>
      <div className={styles.loginWindow}>
        <div className={styles.leftPane}>
          <img className={styles.heroImage} src={HipoLogin.src} alt="Бегемоша" />
        </div>
        <form className={styles.forms} onSubmit={handleSubmit}>
          <h1 className={styles.title}>Вход</h1>

          <h2 className={styles.hello}>
            Рады вас видеть!
            <img className={styles.helloIcon} src={HandIcon.src} alt="" aria-hidden="true" />
          </h2>

          <Input
            label="Логин"
            placeholder="Введите email"
            type="email"
            value={mail}
            onChange={(event) => setMail(event.target.value)}
            autoComplete="email"
            required
          />

          <Input
            label="Пароль"
            placeholder="Введите пароль"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
          />

          {errorMessage && <p className={styles.errorText}>{errorMessage}</p>}

          <Button
            size="m"
            variant="filled"
            fullWidth
            title={isSubmitting ? "Входим..." : "Войти"}
            type="submit"
            disabled={isSubmitting}
          />

          <p className={styles.registerText}>
            Еще нет аккаунта?{" "}
            <Link href="/registration" className={styles.registerLink}>
              Создать аккаунт
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
