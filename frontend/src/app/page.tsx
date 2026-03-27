import Card from "@/components/coursesCards/courseCard";
import Button from "@/components/button/button";
import Header from "@/components/header/header";
import HipoImg from "@/shared/assets/images/hipocatalog.png";
import styles from "./page.module.css";

export default function Home() {
  return (
    <div>
      <Header />
      <div className={styles.main}>
        <div className={styles.aboutus}>
          <div className={styles.imageHipo}>
            <img src={HipoImg.src} alt="" />
          </div>
          <div className={styles.description}>
            <h2 className={styles.title} id="aboutPlatform">Рћ РїР»Р°С‚С„РѕСЂРјРµ</h2>
            <p className={styles.text}>
              <br />
              Р—РЅР°РєРѕРјСЊС‚РµСЃСЊ, СЌС‚Рѕ Р‘РµРіРµРјРѕС€Р° вЂ” СЃР°РјС‹Р№ СѓРјРЅС‹Р№ Рё РґРѕР±СЂС‹Р№ Р±РµРіРµРјРѕС‚ РІ РјРёСЂРµ
              РїСЂРѕРіСЂР°РјРјРёСЂРѕРІР°РЅРёСЏ!
              <br />
              РћРЅ РїРѕРјРѕРіР°РµС‚ РґРµС‚СЏРј РґРµР»Р°С‚СЊ РїРµСЂРІС‹Рµ С€Р°РіРё РІ IT.
              <br />
              Р’РјРµСЃС‚Рµ СЃ Р‘РµРіРµРјРѕС€РµР№ РІР°С€ СЂРµР±РµРЅРѕРє РЅР°СѓС‡РёС‚СЃСЏ РїРёСЃР°С‚СЊ РЅР°СЃС‚РѕСЏС‰РёР№ РєРѕРґ.
              <br />
              Р РІСЃС‘ СЌС‚Рѕ вЂ” РІ РёРіСЂРѕРІРѕР№ С„РѕСЂРјРµ, Р±РµР· СЃРєСѓС‡РЅС‹С… РїСЂР°РІРёР» Рё СЃР»РѕР¶РЅС‹С…
              С‚РµСЂРјРёРЅРѕРІ.
              <br />
              РџСЂРѕРіСЂР°РјРјРёСЂРѕРІР°С‚СЊ РјРѕР¶РµС‚ РєР°Р¶РґС‹Р№, РѕСЃРѕР±РµРЅРЅРѕ СЃ С‚Р°РєРёРј РґСЂСѓРіРѕРј, РєР°Рє
              Р‘РµРіРµРјРѕС€Р°!
            </p>
          </div>
        </div>

        <div className={styles.my_filter_wrapper}>
          <div className={styles.my_title_wrapper}>
            <h2 className={styles.my_title_filter} id="myCourses">
              РњРѕРё РєСѓСЂСЃС‹
            </h2>
          </div>
          <div className={styles.filters}>
            <Button size="m" variant="filled" color="white" title="Р’СЃРµ РєСѓСЂСЃС‹" />
            <Button
              size="m"
              variant="filled"
              color="blue"
              title="РџСЂРѕРіСЂР°РјРјРёСЂРѕРІР°РЅРёРµ"
            />
            <Button
              size="m"
              variant="filled"
              color="orange"
              title="Р¦РёС„СЂРѕРІР°СЏ РіСЂР°РјРѕС‚РЅРѕСЃС‚СЊ"
            />
          </div>
        </div>

        <div className={styles.my_card_wrapper}>
          <Card
            category="РљР°С‚РµРіРѕСЂРёСЏ"
            title="РќР°Р·РІР°РЅРёРµ"
            description="РїСЂРѕРіСЂРµСЃ Р±Р°СЂ)"
            color="blue"
          />
          <Card
            category="РљР°С‚РµРіРѕСЂРёСЏ"
            title="РќР°Р·РІР°РЅРёРµ"
            description="РїСЂРѕРіСЂРµСЃ Р±Р°СЂ)"
            color="orange"
          />
          <Card
            category="РљР°С‚РµРіРѕСЂРёСЏ"
            title="РќР°Р·РІР°РЅРёРµ"
            description="РїСЂРѕРіСЂРµСЃ Р±Р°СЂ)"
            color="blue"
          />
        </div>

        <div className={styles.my_filter_wrapper}>
          <div className={styles.my_title_wrapper}>
            <h2 className={styles.my_title_filter} id="allCourses">
              Р’СЃРµ РєСѓСЂСЃС‹
            </h2>
          </div>
          <div className={styles.filters}>
            <Button size="m" variant="filled" color="white" title="Р’СЃРµ РєСѓСЂСЃС‹" />
            <Button
              size="m"
              variant="filled"
              color="blue"
              title="РџСЂРѕРіСЂР°РјРјРёСЂРѕРІР°РЅРёРµ"
            />
            <Button
              size="m"
              variant="filled"
              color="orange"
              title="Р¦РёС„СЂРѕРІР°СЏ РіСЂР°РјРѕС‚РЅРѕСЃС‚СЊ"
            />
          </div>
        </div>

        <div className={styles.my_card_wrapper}>
          <Card
            category="РљР°С‚РµРіРѕСЂРёСЏ"
            title="РќР°Р·РІР°РЅРёРµ"
            description="РїСЂРѕРіСЂРµСЃ Р±Р°СЂ)"
            color="orange"
          />
          <Card
            category="РљР°С‚РµРіРѕСЂРёСЏ"
            title="РќР°Р·РІР°РЅРёРµ"
            description="РїСЂРѕРіСЂРµСЃ Р±Р°СЂ)"
            color="blue"
          />
          <Card
            category="РљР°С‚РµРіРѕСЂРёСЏ"
            title="РќР°Р·РІР°РЅРёРµ"
            description="РїСЂРѕРіСЂРµСЃ Р±Р°СЂ)"
            color="blue"
          />
        </div>
      </div>
    </div>
  );
}

