import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setTokens,
} from "@/shared/auth/tokens";

const DEFAULT_API_BASE_URL = "http://localhost:8000";
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? DEFAULT_API_BASE_URL;

type RequestOptions = Omit<RequestInit, "headers"> & {
  headers?: HeadersInit;
  auth?: boolean;
  allowRefresh?: boolean;
};

interface ApiErrorPayload {
  detail?: string;
  message?: string;
}

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export interface TokensResponse {
  access_token: string;
  refresh_token: string;
}

export interface UserRegisterPayload {
  first_name: string;
  last_name?: string | null;
  mail: string;
  password: string;
}

export interface UserLoginPayload {
  mail: string;
  password: string;
}

export interface CategoryPublic {
  id: number;
  title: string;
}

export interface CoursePreviewPublic {
  course_id: number;
  title: string;
  description: string | null;
  progress_percent: number;
  category: CategoryPublic | null;
}

export interface HomeCoursesResponse {
  all_courses: CoursePreviewPublic[];
  my_courses: CoursePreviewPublic[];
}

export interface UserCoursePublic {
  course_id: number;
  title: string;
  description: string | null;
  is_published: boolean;
  progress_percent: number;
  xp_earned: number;
  status: string;
  category: CategoryPublic | null;
}

export interface UserPublic {
  id: number;
  first_name: string;
  last_name: string | null;
  mail: string;
  level: number;
  total_xp: number;
  role_id: number;
  courses: UserCoursePublic[];
}

export interface RatingUserPublic {
  user_id: number;
  first_name: string;
  last_name: string | null;
  total_xp: number;
  level: number;
  place: number;
}

export interface AchievementPublic {
  id: number;
  title: string;
  description: string | null;
  icon_url: string | null;
  xp_reward: number;
  is_active: boolean;
}

export interface UserAchievementPublic {
  id: number;
  title: string;
  description: string | null;
  icon_url: string | null;
  xp_reward: number;
  received_at: string;
}

export interface CourseDetailPublic {
  id: number;
  title: string;
  description: string | null;
  is_published: boolean;
  category_id: number | null;
  progress_percent: number | null;
  created_at: string;
  updated_at: string;
  category: CategoryPublic | null;
}

export interface EnrollCourseResponse {
  message: string;
  course_id: number;
  user_id: number;
  status: string;
  progress_percent: number;
  xp_earned: number;
}

export type TaskType = "lecture" | "practice" | "quiz";

export interface TaskTreePublic {
  id: number;
  title: string;
  description: string | null;
  task_type: TaskType;
  order_index: number;
  xp_reward: number;
  is_published: boolean;
}

export interface TopicTreePublic {
  id: number;
  title: string;
  description: string | null;
  order_index: number;
  tasks: TaskTreePublic[];
}

export interface ModuleTreePublic {
  id: number;
  title: string;
  description: string | null;
  order_index: number;
  topics: TopicTreePublic[];
}

export interface CourseTreePublic {
  id: number;
  title: string;
  description: string | null;
  is_published: boolean;
  progress_percent: number | null;
  category: CategoryPublic | null;
  modules: ModuleTreePublic[];
}

export interface TaskAnswerResponse {
  task_id: number;
  is_correct: boolean;
  score: number;
  awarded_xp: number;
  attempt: number;
  progress_percent: number;
  total_xp: number;
  level: number;
  message: string;
  awarded_achievements: Array<{
    id: number;
    title: string;
    description: string | null;
    icon_url: string | null;
    xp_reward: number;
  }>;
}

async function parseResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  const data = text ? tryParseJson(text) : null;

  if (!response.ok) {
    const payload = (data ?? {}) as ApiErrorPayload;
    const message =
      payload.detail ?? payload.message ?? `Request failed with status ${response.status}`;
    throw new ApiError(message, response.status);
  }

  return data as T;
}

function tryParseJson(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function toAbsoluteUrl(path: string): string {
  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    return null;
  }

  const response = await fetch(toAbsoluteUrl("/users/refresh"), {
    method: "GET",
    headers: {
      REFRESH_TOKEN: refreshToken,
    },
  });

  if (!response.ok) {
    return null;
  }

  const tokens = (await parseResponse<TokensResponse>(response)) as TokensResponse;
  setTokens(tokens.access_token, tokens.refresh_token);
  return tokens.access_token;
}

async function request<T>(
  path: string,
  {
    headers,
    auth = true,
    allowRefresh = true,
    ...init
  }: RequestOptions = {}
): Promise<T> {
  const url = toAbsoluteUrl(path);
  const requestHeaders = new Headers(headers ?? {});
  const hasBody = init.body !== undefined && init.body !== null;

  if (hasBody && !(init.body instanceof FormData) && !requestHeaders.has("Content-Type")) {
    requestHeaders.set("Content-Type", "application/json");
  }

  if (auth) {
    const accessToken = getAccessToken();

    if (accessToken) {
      requestHeaders.set("ACCESS_TOKEN", accessToken);
    }
  }

  const response = await fetch(url, {
    ...init,
    headers: requestHeaders,
  });

  if (response.status === 401 && auth && allowRefresh) {
    const refreshedAccessToken = await refreshAccessToken();

    if (!refreshedAccessToken) {
      clearTokens();
      throw new ApiError("Authentication required. Please log in again.", 401);
    }

    requestHeaders.set("ACCESS_TOKEN", refreshedAccessToken);
    const retryResponse = await fetch(url, {
      ...init,
      headers: requestHeaders,
    });

    if (retryResponse.status === 401) {
      clearTokens();
    }

    return parseResponse<T>(retryResponse);
  }

  return parseResponse<T>(response);
}

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (
    error instanceof TypeError &&
    /failed to fetch|networkerror|load failed/i.test(error.message)
  ) {
    return fallback;
  }

  if (error instanceof Error && error.message) {
    if (/failed to fetch|networkerror|load failed/i.test(error.message)) {
      return fallback;
    }
    return error.message;
  }

  return fallback;
}

export async function registerUser(payload: UserRegisterPayload): Promise<UserPublic> {
  return request<UserPublic>("/users/register", {
    method: "POST",
    auth: false,
    body: JSON.stringify(payload),
  });
}

export async function loginUser(payload: UserLoginPayload): Promise<TokensResponse> {
  return request<TokensResponse>("/users/login", {
    method: "POST",
    auth: false,
    body: JSON.stringify(payload),
  });
}

export async function getMyProfile(): Promise<UserPublic> {
  return request<UserPublic>("/users/me");
}

export async function getHomeCourses(): Promise<HomeCoursesResponse> {
  return request<HomeCoursesResponse>("/courses/home");
}

export async function getRatingTop(limit = 10): Promise<RatingUserPublic[]> {
  return request<RatingUserPublic[]>(`/rating/top?limit=${limit}`, { auth: false });
}

export async function getMyAchievements(): Promise<UserAchievementPublic[]> {
  return request<UserAchievementPublic[]>("/users/me/achievements");
}

export async function getAllAchievements(): Promise<AchievementPublic[]> {
  return request<AchievementPublic[]>("/achievements", { auth: false });
}

export async function getCourseById(courseId: number): Promise<CourseDetailPublic> {
  return request<CourseDetailPublic>(`/courses/${courseId}`);
}

export async function enrollCourse(courseId: number): Promise<EnrollCourseResponse> {
  return request<EnrollCourseResponse>(`/courses/${courseId}/enroll`, { method: "POST" });
}

export async function getCourseTree(courseId: number): Promise<CourseTreePublic> {
  return request<CourseTreePublic>(`/courses/${courseId}/tree`);
}

export async function submitTaskAnswer(
  taskId: number,
  answerBody: string
): Promise<TaskAnswerResponse> {
  return request<TaskAnswerResponse>(`/tasks/${taskId}/answer`, {
    method: "POST",
    body: JSON.stringify({
      answer_body: answerBody,
    }),
  });
}
