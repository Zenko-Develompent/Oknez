# Образовательная платформа Бегемоша <img src="frontend/src/shared/assets/icons/logo.svg" alt="Описание" width="50" height="50">
<img src="frontend/src/shared/assets/images/hipilogin.png" alt="Описание" width="200" height="200">

## 📝 Описание
Проект образовательной платформы "Бегемоша" для обучения программирования детей от 7 до 15 лет

**Основные возможности:**
*   **Иерархия контента**: Поддержка структуры Категории → Курсы → Модули → Темы → Задания. <img src="frontend/src/shared/assets/images/firstplace.png" alt="Описание" width="25" height="25">
*   **Геймификация**: Система уровней, расчет XP (опыта) и автоматическая выдача достижений. <img src="frontend/src/shared/assets/images/secondplace.png" alt="Описание" width="25" height="25">
*   **Безопасность**: Хеширование паролей и контроль доступа <img src="frontend/src/shared/assets/images/thirdplace.png" alt="Описание" width="25" height="25">

## 🚀 Запуск проекта
Для запуска проекта на компьютере должен быть установлен git, docker и docker-compose

### 1. Клонирование репозитория
#### Клонируйте репозиторий (можете скопировать ссылку в правом углу)
```bash
git clone https://github.com/Zenko-Develompent/fivneosi343f
cd fivneosi343f
```

### 2. Подготовка переменных окружения
#### Для безопасности в репозитории есть только .env.example. Его нужно скопировать в файл окружения .env
```bash
cp backend/.env.example backend/.env
```

### 3. Запуск проекта
#### Для запуска используется docker-compose и файл docker-compose.yml в корне проекта
```bash
docker compose up -d
```



