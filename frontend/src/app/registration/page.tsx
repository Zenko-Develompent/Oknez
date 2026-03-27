"use client";

import Input from "@/components/input/input";
import Button from "@/components/button/button";
import HipoChild from "@/shared/assets/images/hipochild.png";
import HipoParent from "@/shared/assets/images/hipoparent.png";
import styles from "./registration.module.css";
export default function RegistrationPage() {
  return (
    <div>
      <div className={styles.main}>
        <div className={styles.registrationWindow}>
          <h1 className={styles.title}>Регистрация</h1>
          <h3 className={styles.title3}>Выбери свою роль</h3>
          <div className={styles.hipoinfo}>
            <div className={styles.child}>
              <h3 className={styles.titleChild}>Ученик</h3>
              <div className={styles.image}>
                <img src={HipoChild.src} alt="Ученик" />
              </div>
            </div>
            <div className={styles.parent}>
              <h3 className={styles.titleParent}>Родитель</h3>
              <div className={styles.image}>
                <img src={HipoParent.src} alt="Родитель" />
              </div>
            </div>
          </div>
          <div className={styles.forms}>
            <Input
              label="Имя и фамилия"
              placeholder="Введите имя и фамилию"
              type="text"
            />
            <Input label="Почта" placeholder="Введите почту" type="email" />
            <Input
              label="Пароль"
              placeholder="Введите пароль"
              type="password"
            />
            <Button
              size="m"
              variant="filled"
              color="logo"
              fullWidth
              title="Создать аккаунт"
            />

            <div className="hadaccount">
              <span>Уже есть аккаунт?</span> <a href="#">Войти</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
