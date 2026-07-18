import * as SecureStore from 'expo-secure-store';

// 開発中はシミュレータならlocalhostでよいが、実機（Expo Go/開発ビルド）からは
// PCのLAN IPやトンネルURLに到達できる必要がある。EXPO_PUBLIC_API_BASE_URLで上書きする。
const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';

const ACCESS_TOKEN_KEY = 'walkArticle.accessToken';

export type Tone = 'casual' | 'polite';
export type RecordingStatus = 'uploading' | 'queued' | 'transcribing' | 'generating' | 'completed' | 'failed';
export type ArticlePlatform = 'note' | 'x';

export class ApiError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export async function getStoredAccessToken(): Promise<string | null> {
  return SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
}

export async function setStoredAccessToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);
}

export async function clearStoredAccessToken(): Promise<void> {
  await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
}

async function request<T>(
  path: string,
  options: { method?: string; body?: unknown; accessToken?: string | null } = {},
): Promise<T> {
  const { method = 'GET', body, accessToken } = options;

  const headers: Record<string, string> = {};
  if (body !== undefined) {
    headers['content-type'] = 'application/json';
  }
  if (accessToken) {
    headers.authorization = `Bearer ${accessToken}`;
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  const json = text.length > 0 ? JSON.parse(text) : {};

  if (!response.ok) {
    const code = json?.error?.code ?? 'UNKNOWN_ERROR';
    const message = json?.error?.message ?? `リクエストに失敗しました（${response.status}）`;
    throw new ApiError(code, message, response.status);
  }

  return json as T;
}

// ---- 認証（§13） ----

export interface AuthenticateWithAppleResult {
  accessToken: string;
  user: { id: string; displayName: string | null };
}

export function authenticateWithApple(
  identityToken: string,
  fullName?: { givenName?: string | null; familyName?: string | null },
): Promise<AuthenticateWithAppleResult> {
  return request('/v1/auth/apple', {
    method: 'POST',
    body: {
      identityToken,
      ...(fullName?.givenName || fullName?.familyName
        ? { fullName: { givenName: fullName.givenName ?? undefined, familyName: fullName.familyName ?? undefined } }
        : {}),
    },
  });
}

// ---- 録音・処理（§13） ----

export interface CreateRecordingResult {
  recordingId: string;
  uploadUrl: string;
  storageKey: string;
  expiresIn: number;
}

export function createRecording(
  accessToken: string,
  params: { durationSeconds: number; fileSizeBytes: number; recordedAt: string },
): Promise<CreateRecordingResult> {
  return request('/v1/recordings', { method: 'POST', body: params, accessToken });
}

export async function uploadAudioToStorage(uploadUrl: string, audio: Blob): Promise<void> {
  const response = await fetch(uploadUrl, { method: 'PUT', body: audio });
  if (!response.ok) {
    throw new Error(`音声のアップロードに失敗しました（${response.status}）`);
  }
}

export function completeUpload(accessToken: string, recordingId: string): Promise<{ status: string }> {
  return request(`/v1/recordings/${recordingId}/complete-upload`, { method: 'POST', accessToken });
}

export function getRecordingStatus(
  accessToken: string,
  recordingId: string,
): Promise<{ id: string; status: RecordingStatus; failedReason: string | null }> {
  return request(`/v1/recordings/${recordingId}`, { accessToken });
}

export interface RecordingArticle {
  id: string;
  platform: ArticlePlatform;
  title: string | null;
  body: string;
  editedBody: string | null;
}

export function getRecordingArticles(
  accessToken: string,
  recordingId: string,
): Promise<{ articles: RecordingArticle[] }> {
  return request(`/v1/recordings/${recordingId}/articles`, { accessToken });
}

export interface HistoryItem {
  id: string;
  recordedAt: string;
  status: RecordingStatus;
  articles: Array<{ platform: ArticlePlatform; excerpt: string }>;
}

export function listRecordings(
  accessToken: string,
  params: { query?: string; cursor?: string; limit?: number } = {},
): Promise<{ items: HistoryItem[]; nextCursor: string | null }> {
  const search = new URLSearchParams();
  if (params.query) search.set('query', params.query);
  if (params.cursor) search.set('cursor', params.cursor);
  if (params.limit) search.set('limit', String(params.limit));
  const qs = search.toString();
  return request(`/v1/recordings${qs ? `?${qs}` : ''}`, { accessToken });
}

// ---- 記事（§13） ----

export function updateArticle(
  accessToken: string,
  articleId: string,
  params: { editedBody: string; editedTitle?: string },
): Promise<RecordingArticle> {
  return request(`/v1/articles/${articleId}`, { method: 'PATCH', body: params, accessToken });
}

export function markArticleCopied(accessToken: string, articleId: string): Promise<{ postedAt: string }> {
  return request(`/v1/articles/${articleId}/mark-copied`, { method: 'POST', accessToken });
}

// ---- 設定・アカウント（§13） ----

export function getSettings(accessToken: string): Promise<{ tone: Tone; autoPostXEnabled: boolean }> {
  return request('/v1/me/settings', { accessToken });
}

export function updateSettings(
  accessToken: string,
  params: { tone?: Tone; autoPostXEnabled?: boolean },
): Promise<{ tone: Tone; autoPostXEnabled: boolean }> {
  return request('/v1/me/settings', { method: 'PATCH', body: params, accessToken });
}

export function registerPushToken(accessToken: string, expoPushToken: string): Promise<void> {
  return request('/v1/me/push-tokens', { method: 'POST', body: { expoPushToken }, accessToken });
}

// App Store審査ガイドライン5.1.1(v)対応。関連する録音・記事・音声も含めてサーバー側で完全削除する
export function deleteAccount(accessToken: string): Promise<void> {
  return request('/v1/me', { method: 'DELETE', accessToken });
}
