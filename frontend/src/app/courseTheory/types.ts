export interface CourseThemeLessonDTO {
  lessonId: string;
  title: string;
}

export interface CourseModuleThemeDTO {
  themeId: string;
  title: string;
  lessons: CourseThemeLessonDTO[];
}

export interface CourseModuleDTO {
  moduleId: string;
  title: string;
  themes: CourseModuleThemeDTO[];
}

export interface QuizOptionDTO {
  id: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

export interface QuizQuestionDTO {
  id: string;
  prompt: string;
  options: QuizOptionDTO[];
  // Локальный fallback до подключения серверной проверки.
  correctOptionId?: string;
  explanation?: string;
}

export interface MemoryMatchPairDTO {
  id: string;
  term: string;
  definition: string;
}

export interface GuessCodeOptionDTO {
  id: string;
  label: string;
  isCorrect: boolean;
}

export interface GuessCodeQuestionDTO {
  id: string;
  prompt: string;
  mode: "single" | "multiple";
  options: GuessCodeOptionDTO[];
}

export interface FixCodeTaskDTO {
  id: string;
  brokenCode: string;
  prompt: string;
  options: GuessCodeOptionDTO[];
}

export interface CourseThemeItemDTO {
  type: "theme";
  moduleId: string;
  themeId: string;
  title: string;
  // Текст из markdown после загрузки/подстановки с backend.
  contentMd?: string;
  text: string;
}

export interface CourseLessonItemDTO {
  type: "lesson";
  moduleId: string;
  themeId: string;
  lessonId: string;
  title: string;
  // Текст из markdown после загрузки/подстановки с backend.
  contentMd?: string;
  text: string;
  showCompiler?: boolean;
  compilerInitialCode?: string;
  // Точка серверной проверки ответа по квизу.
  quizCheckEndpoint?: string;
  // Точка серверной проверки результата запуска компилятора.
  compilerCheckEndpoint?: string;
  quizQuestions?: QuizQuestionDTO[];
}

export interface CourseGameItemDTO {
  type: "game";
  moduleId: string;
  themeId: string;
  gameId: string;
  title: string;
  description?: string;
  gameType: "memoryMatch" | "guessCode" | "fixCode";
  // если игра относится к конкретному уроку, чтобы сохранять подсветку в сайдбаре
  lessonId?: string;
  memoryPairs?: MemoryMatchPairDTO[];
  guessCodeQuestions?: GuessCodeQuestionDTO[];
  fixCodeTasks?: FixCodeTaskDTO[];
}

export type CourseItemDTO = CourseThemeItemDTO | CourseLessonItemDTO | CourseGameItemDTO;

export interface CourseTheoryPayloadDTO {
  courseId: string;
  courseTitle: string;
  audience?: string;
  modules: CourseModuleDTO[];
  flow: CourseItemDTO[];
}

export type LessonFormat = "compiler" | "game" | "single_choice" | "final_test";
export type LessonGameType = "memoryMatch" | "guessCode" | "fixCode";

export interface LessonCheckOptionDTO {
  id: string;
  label: string;
  description?: string;
  isCorrect: boolean;
}

export interface LessonCheckQuestionDTO {
  id: string;
  prompt: string;
  options: LessonCheckOptionDTO[];
  explanation?: string;
}

export interface CourseLessonProgramDTO {
  lessonId: string;
  title: string;
  format: LessonFormat;
  theory: string;
  coinReward: number;
  compilerInitialCode?: string;
  gameType?: LessonGameType;
  memoryPairs?: MemoryMatchPairDTO[];
  guessCodeQuestions?: GuessCodeQuestionDTO[];
  fixCodeTasks?: FixCodeTaskDTO[];
  checkQuestion?: LessonCheckQuestionDTO;
  finalQuestions?: LessonCheckQuestionDTO[];
  passScore?: number;
}

export interface CourseThemeProgramDTO {
  themeId: string;
  title: string;
  summary: string;
  lessons: CourseLessonProgramDTO[];
}

export interface CourseModuleProgramDTO {
  moduleId: string;
  title: string;
  description: string;
  themes: CourseThemeProgramDTO[];
}

export interface LocalAchievementRuleDTO {
  type: "completed_lessons" | "coins" | "lesson_completed";
  value: number | string;
}

export interface LocalAchievementDTO {
  id: string;
  title: string;
  description: string;
  badgeValue: number;
  rule: LocalAchievementRuleDTO;
}

export interface LocalCourseProgramDTO {
  courseId: number;
  courseTitle: string;
  audience: string;
  courseDescription: string;
  outcomes: string[];
  modules: CourseModuleProgramDTO[];
  achievements: LocalAchievementDTO[];
}

export interface LocalCourseProgressDTO {
  completedLessonIds: string[];
  coins: number;
  unlockedAchievementIds: string[];
}
