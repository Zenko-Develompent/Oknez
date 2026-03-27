export type QuizQuestionType = "single" | "multiple";

export interface CourseThemeLessonDTO {
  lessonId: string;
  title: string;
}

export interface CourseThemeDTO {
  themeId: string;
  title: string;
  lessons: CourseThemeLessonDTO[];
}

export interface QuizOptionDTO {
  id: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

export interface QuizQuestionDTO {
  id: string;
  type: QuizQuestionType;
  prompt: string;
  options: QuizOptionDTO[];
  correctOptionIds: string[];
  explanation?: string;
}

export interface CourseThemeItemDTO {
  type: "theme";
  themeId: string;
  title: string;
  text: string;
}

export interface CourseLessonItemDTO {
  type: "lesson";
  themeId: string;
  lessonId: string;
  title: string;
  text: string;
  showCompiler?: boolean;
  compilerInitialCode?: string;
  quizQuestions?: QuizQuestionDTO[];
}

export type CourseItemDTO = CourseThemeItemDTO | CourseLessonItemDTO;

export interface CourseTheoryPayloadDTO {
  courseTitle: string;
  themes: CourseThemeDTO[];
  flow: CourseItemDTO[];
}
