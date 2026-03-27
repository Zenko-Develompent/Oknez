import type { CourseTheoryPayloadDTO } from "./types";

// Структура совпадает с ожидаемым payload от backend.
export const LOCAL_COURSE_THEORY_PAYLOAD: CourseTheoryPayloadDTO = {
  courseTitle: "Python для исследователей: кодим безопасно",
  themes: [
    {
      themeId: "theme-1",
      title: "Модуль 1. Старт в Python",
      lessons: [
        { lessonId: "lesson-1", title: "Урок 1. Переменные и print()" },
        { lessonId: "lesson-2", title: "Урок 2. Ввод данных и условия" },
      ],
    },
    {
      themeId: "theme-2",
      title: "Модуль 2. Циклы и практические задачи",
      lessons: [
        { lessonId: "lesson-1", title: "Урок 3. Цикл for и подсчет символов" },
        { lessonId: "lesson-2", title: "Урок 4. Проверка надежности пароля" },
      ],
    },
    {
      themeId: "theme-3",
      title: "Модуль 3. Безопасное программирование",
      lessons: [
        { lessonId: "lesson-1", title: "Урок 5. Валидация пользовательского ввода" },
        { lessonId: "lesson-2", title: "Урок 6. Поиск подозрительных команд" },
      ],
    },
    {
      themeId: "theme-4",
      title: "Модуль 4. Контрольные уроки (только выбор ответа)",
      lessons: [
        { lessonId: "lesson-1", title: "Урок 7. Single choice контроль" },
        { lessonId: "lesson-2", title: "Урок 8. Multiple choice контроль" },
      ],
    },
    {
      themeId: "theme-5",
      title: "Модуль 5. Финальная практика",
      lessons: [{ lessonId: "lesson-1", title: "Урок 9. Код + тест" }],
    },
  ],
  flow: [
    {
      type: "theme",
      themeId: "theme-1",
      title: "Модуль 1. Старт в Python",
      text:
        "В этом модуле ты пишешь самые первые программы на Python.\n" +
        "Основной фокус: переменные, ввод/вывод и условия.",
    },
    {
      type: "lesson",
      themeId: "theme-1",
      lessonId: "lesson-1",
      title: "Урок 1. Переменные и print()",
      text:
        "Создай две переменные: имя и возраст.\n" +
        "Выведи фразу: Привет, меня зовут ... Мне ... лет.",
      compilerInitialCode:
        "name = \"Алия\"\n" +
        "age = 12\n" +
        "print(f\"Привет, меня зовут {name}. Мне {age} лет.\")",
      quizQuestions: [
        {
          id: "t1-l1-q1",
          type: "single",
          prompt: "Что выводит данные в консоль Python?",
          options: [
            { id: "print", label: "print()" },
            { id: "input", label: "input()" },
            { id: "class", label: "class" },
          ],
          correctOptionIds: ["print"],
          explanation: "print() выводит данные, input() считывает ввод пользователя.",
        },
      ],
    },
    {
      type: "lesson",
      themeId: "theme-1",
      lessonId: "lesson-2",
      title: "Урок 2. Ввод данных и условия",
      text:
        "Спроси возраст пользователя и выведи:\n" +
        "- Доступ разрешен, если возраст >= 10\n" +
        "- Попроси помощь взрослого, если возраст < 10",
      compilerInitialCode:
        "age = int(input(\"Сколько тебе лет? \"))\n" +
        "if age >= 10:\n" +
        "    print(\"Доступ разрешен\")\n" +
        "else:\n" +
        "    print(\"Попроси помощь взрослого\")",
    },
    {
      type: "theme",
      themeId: "theme-2",
      title: "Модуль 2. Циклы и практические задачи",
      text:
        "Здесь ты используешь циклы и практикуешь базовые алгоритмы.\n" +
        "После кода идут вопросы для самопроверки.",
    },
    {
      type: "lesson",
      themeId: "theme-2",
      lessonId: "lesson-1",
      title: "Урок 3. Цикл for и подсчет символов",
      text:
        "Напиши программу, которая считает длину пароля через цикл for.",
      compilerInitialCode:
        "password = input(\"Введите пароль: \")\n" +
        "count = 0\n" +
        "for _ in password:\n" +
        "    count += 1\n" +
        "print(\"Длина пароля:\", count)",
    },
    {
      type: "lesson",
      themeId: "theme-2",
      lessonId: "lesson-2",
      title: "Урок 4. Проверка надежности пароля",
      text:
        "Проверь пароль: длина >= 8 и наличие хотя бы одной цифры.",
      compilerInitialCode:
        "password = input(\"Введите пароль: \")\n" +
        "has_digit = any(ch.isdigit() for ch in password)\n" +
        "\n" +
        "if len(password) >= 8 and has_digit:\n" +
        "    print(\"Пароль подходит\")\n" +
        "else:\n" +
        "    print(\"Пароль слишком слабый\")",
      quizQuestions: [
        {
          id: "t2-l2-q1",
          type: "multiple",
          prompt: "Что обычно делает пароль надежнее?",
          options: [
            { id: "length", label: "Длина 8+ символов" },
            { id: "digits", label: "Наличие цифр" },
            { id: "upper", label: "Наличие заглавных букв" },
            { id: "simple", label: "Шаблон 123456", disabled: true },
          ],
          correctOptionIds: ["length", "digits", "upper"],
          explanation: "Сильный пароль обычно комбинирует длину и разные типы символов.",
        },
      ],
    },
    {
      type: "theme",
      themeId: "theme-3",
      title: "Модуль 3. Безопасное программирование",
      text:
        "Научись фильтровать ввод и находить рискованные конструкции в коде.",
    },
    {
      type: "lesson",
      themeId: "theme-3",
      lessonId: "lesson-1",
      title: "Урок 5. Валидация пользовательского ввода",
      text:
        "Проверь, что логин содержит только буквы и цифры.",
      compilerInitialCode:
        "login = input(\"Введите логин: \")\n" +
        "if login.isalnum():\n" +
        "    print(\"Логин валиден\")\n" +
        "else:\n" +
        "    print(\"Логин содержит недопустимые символы\")",
    },
    {
      type: "lesson",
      themeId: "theme-3",
      lessonId: "lesson-2",
      title: "Урок 6. Поиск подозрительных команд",
      text:
        "Сделай проверку на eval, exec и os.system в строке кода.",
      compilerInitialCode:
        "line = input(\"Вставь строку кода: \")\n" +
        "blocked = [\"eval\", \"exec\", \"os.system\"]\n" +
        "if any(word in line for word in blocked):\n" +
        "    print(\"Найдена потенциально опасная команда\")\n" +
        "else:\n" +
        "    print(\"Явно опасных команд не найдено\")",
    },
    {
      type: "theme",
      themeId: "theme-4",
      title: "Модуль 4. Контрольные уроки (только выбор ответа)",
      text:
        "В этом модуле отдельные уроки без компилятора.\n" +
        "Только вопросы с проверкой правильности/неправильности.",
    },
    {
      type: "lesson",
      themeId: "theme-4",
      lessonId: "lesson-1",
      title: "Урок 7. Single choice контроль",
      text:
        "Выбери один правильный вариант ответа по условиям и типам данных.",
      showCompiler: false,
      quizQuestions: [
        {
          id: "t4-l1-q1",
          type: "single",
          prompt: "Какой тип данных у значения 3.14?",
          options: [
            { id: "int", label: "int" },
            { id: "float", label: "float" },
            { id: "str", label: "str" },
          ],
          correctOptionIds: ["float"],
          explanation: "Числа с десятичной частью в Python имеют тип float.",
        },
        {
          id: "t4-l1-q2",
          type: "single",
          prompt: "Какой оператор сравнивает на равенство?",
          options: [
            { id: "assign", label: "=" },
            { id: "equal", label: "==" },
            { id: "not-equal", label: "!=" },
          ],
          correctOptionIds: ["equal"],
          explanation: "= присваивает, а == сравнивает значения.",
        },
      ],
    },
    {
      type: "lesson",
      themeId: "theme-4",
      lessonId: "lesson-2",
      title: "Урок 8. Multiple choice контроль",
      text:
        "Выбери несколько правильных вариантов по теме циклов.",
      showCompiler: false,
      quizQuestions: [
        {
          id: "t4-l2-q1",
          type: "multiple",
          prompt: "Какие конструкции в Python являются циклами?",
          options: [
            { id: "for", label: "for" },
            { id: "while", label: "while" },
            { id: "if", label: "if" },
            { id: "def", label: "def" },
          ],
          correctOptionIds: ["for", "while"],
          explanation: "for и while выполняют повторения, if и def нет.",
        },
      ],
    },
    {
      type: "theme",
      themeId: "theme-5",
      title: "Модуль 5. Финальная практика",
      text:
        "Итоговый урок объединяет код и вопросы.\n" +
        "Сначала практика в компиляторе, затем проверка ответов.",
    },
    {
      type: "lesson",
      themeId: "theme-5",
      lessonId: "lesson-1",
      title: "Урок 9. Код + тест",
      text:
        "Сделай мини-валидатор пароля:\n" +
        "1. Длина от 8 символов\n" +
        "2. Есть хотя бы одна цифра\n" +
        "3. Есть хотя бы одна заглавная буква\n" +
        "После запуска проверь себя в quiz-блоке.",
      compilerInitialCode:
        "password = input(\"Введите пароль: \")\n" +
        "has_digit = any(ch.isdigit() for ch in password)\n" +
        "has_upper = any(ch.isupper() for ch in password)\n" +
        "\n" +
        "if len(password) >= 8 and has_digit and has_upper:\n" +
        "    print(\"Пароль проходит проверку\")\n" +
        "else:\n" +
        "    print(\"Пароль не проходит проверку\")",
      quizQuestions: [
        {
          id: "t5-l1-q1",
          type: "single",
          prompt: "Какой метод проверяет, что символ является цифрой?",
          options: [
            { id: "isdigit", label: "isdigit()" },
            { id: "isalpha", label: "isalpha()" },
            { id: "islower", label: "islower()" },
          ],
          correctOptionIds: ["isdigit"],
        },
        {
          id: "t5-l1-q2",
          type: "multiple",
          prompt: "Какие проверки есть в финальном скрипте?",
          options: [
            { id: "length", label: "Длина пароля" },
            { id: "digit", label: "Наличие цифры" },
            { id: "upper", label: "Наличие заглавной буквы" },
            { id: "bcrypt", label: "Хэширование bcrypt" },
          ],
          correctOptionIds: ["length", "digit", "upper"],
        },
      ],
    },
  ],
};
