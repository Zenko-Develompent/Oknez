"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Input from "@/components/input/input";
import Button from "@/components/button/button";
import HippoHello from "@/shared/assets/images/hippohello.png";
import {
  getApiErrorMessage,
  loginUser,
  registerUser,
} from "@/shared/api/client";
import { setTokens } from "@/shared/auth/tokens";
import styles from "./registration.module.css";

function splitFullName(value: string): { firstName: string; lastName: string | null } {
  const chunks = value
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (chunks.length === 0) {
    return {
      firstName: "",
      lastName: null,
    };
  }

  return {
    firstName: chunks[0],
    lastName: chunks.length > 1 ? chunks.slice(1).join(" ") : null,
  };
}

export default function RegistrationPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [mail, setMail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");

    const { firstName, lastName } = splitFullName(fullName);

    if (!firstName) {
      setErrorMessage("Укажи имя и фамилию.");
      return;
    }

    if (!mail.trim() || !password) {
      setErrorMessage("Заполни email и пароль.");
      return;
    }

    try {
      setIsSubmitting(true);
      await registerUser({
        first_name: firstName,
        last_name: lastName,
        mail: mail.trim(),
        password,
      });

      const tokens = await loginUser({
        mail: mail.trim(),
        password,
      });
      setTokens(tokens.access_token, tokens.refresh_token);
      router.push("/");
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(error, "Не удалось зарегистрировать аккаунт.")
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className={styles.main}>
        <form className={styles.registrationWindow} onSubmit={handleSubmit}>
          <h1 className={styles.title}>Регистрация</h1>
          <img className={styles.heroImage} src={HippoHello.src} alt="Бегемоша" />
          <div className={styles.forms}>
            <Input
              label="Имя и фамилия"
              placeholder="Введите имя и фамилию"
              type="text"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              autoComplete="name"
              required
            />
            <Input
              label="Почта"
              placeholder="Введите почту"
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
              autoComplete="new-password"
              required
            />

            {errorMessage && <p className={styles.errorText}>{errorMessage}</p>}

            <Button
              size="m"
              variant="filled"
              color="logo"
              fullWidth
              title={isSubmitting ? "Создаем..." : "Создать аккаунт"}
              type="submit"
              disabled={isSubmitting}
            />

            <p className={styles.hadAccount}>
              Уже есть аккаунт?{" "}
              <Link href="/login" className={styles.loginLink}>
                Войти
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
