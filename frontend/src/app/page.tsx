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
            <h2 className={styles.title}>О платформе</h2>
            <p className={styles.text}>
              <br />
              Знакомьтесь, это Бегемоша — самый умный и добрый бегемот в мире
              программирования!
              <br />
              Он помогает детям делать первые шаги в IT.
              <br />
              Вместе с Бегемошей ваш ребенок научится писать настоящий код.
              <br />
              И всё это — в игровой форме, без скучных правил и сложных
              терминов.
              <br />
              Программировать может каждый, особенно с таким другом, как
              Бегемоша!
            </p>
          </div>
        </div>

        <div className={styles.my_filter_wrapper}>
          <div className={styles.my_title_wrapper}>
            <h2 className={styles.my_title_filter} id="myCourses">
              Мои курсы
            </h2>
          </div>
          <div className={styles.filters}>
            <Button
              size="s"
              variant="filled"
              title="Все курсы"
              backgroundColor="var(--state-default)"
            />
            <Button size="s" variant="filled" title="Программирование" />
            <Button size="s" variant="filled" title="Цифровая грамотность" />
          </div>
        </div>

        <div className={styles.my_card_wrapper}>
          <Card
            category="Категория"
            title="Название"
            description="прогрес бар)"
            backgroundColor="green"
            textColor="white"
          />
          <Card
            category="Категория"
            title="Название"
            description="прогрес бар)"
            backgroundColor="green"
            textColor="white"
          />
          <Card
            category="Категория"
            title="Название"
            description="прогрес бар)"
            backgroundColor="green"
            textColor="white"
          />
        </div>

        <div className={styles.my_filter_wrapper}>
          <div className={styles.my_title_wrapper}>
            <h2 className={styles.my_title_filter} id="allCourses">
              Все курсы
            </h2>
          </div>
          <div className={styles.filters}>
            <Button size="s" variant="filled" title="Все курсы" />
            <Button size="s" variant="filled" title="Программирование" />
            <Button size="s" variant="filled" title="Цифровая грамотность" />
          </div>
        </div>

        <div className={styles.my_card_wrapper}>
          <Card
            category="Категория"
            title="Название"
            description="прогрес бар)"
            backgroundColor="blue"
            textColor="white"
          />
          <Card
            category="Категория"
            title="Название"
            description="прогрес бар)"
            backgroundColor="blue"
            textColor="white"
          />
          <Card
            category="Категория"
            title="Название"
            description="прогрес бар)"
            backgroundColor="blue"
            textColor="white"
          />
        </div>
      </div>
    </div>
  );
}
