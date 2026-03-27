"use client";

import styles from "./header.module.css";
import AccountIcon from "@/shared/assets/icons/account_circle.svg";
import LogoIcon from "@/shared/assets/icons/logo.svg";
import Link from "next/link";

export default function Header() {
  return (
    <header className={styles.header}>
      <Link href="#" className={styles.logo}>
        <img className={styles.logoImage} src={LogoIcon.src} alt="Р›РѕРіРѕС‚РёРї Р‘РµРіРµРјРѕС€Р°" />
        Р‘РµРіРµРјРѕС€Р°
      </Link>
      <nav className={styles.nav}>
        <ul className={styles.navList}>
          <li>
            <Link href="#myCourses" className={styles.link}>
              РњРѕРё РєСѓСЂСЃС‹
            </Link>
          </li>
          <li>
            <Link href="#!" className={styles.link}>
              Рћ РїР»Р°С‚С„РѕСЂРјРµ
            </Link>
          </li>
          <li>
            <Link href="#allCourses" className={styles.link}>
              Р’СЃРµ РєСѓСЂСЃС‹
            </Link>
          </li>
        </ul>
      </nav>

      <Link href="/account" className={styles.profile} aria-label="Р’РѕР№С‚Рё РІ Р°РєРєР°СѓРЅС‚">
        <img src={AccountIcon.src} alt="" />
      </Link>
    </header>
  );
}

// {!isAuth ? <li>
//           <a href="!#">Рћ РЅР°СЃ</a>
//         </li>:  }
