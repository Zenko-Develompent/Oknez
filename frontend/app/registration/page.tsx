'use client'
import styles from './registration.module.css';
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
                <div className={styles.image}></div>
              </div>
              <div className={styles.parent}>
                <h3 className={styles.titleParent}>Родитель</h3>
                <div className={styles.image}></div>
              </div>
            </div>
            <div className={styles.forms}>
              <label htmlFor="surname_name">Имя и фамилия</label>
              <input id="surname_name" type="text" placeholder='Введите имя и фамилию'/>
              <label htmlFor="email">Почта</label>
              <input id="email" type="email" placeholder='Введите почту'/>
              <label htmlFor="password">Пароль</label>
              <input id="password" type="password" placeholder='Введите пароль'/>
              <button>Создать аккаунт</button>
              <span>Уже есть аккаунт?</span> <a href="/login">Войти</a>
            </div>
        </div>
      </div>
    </div>
  );
}