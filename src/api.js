const DEFAULT_API_BASE_URL = '/api';
const configuredApiBaseUrl = (process.env.REACT_APP_API_URL || DEFAULT_API_BASE_URL).trim();

const normalizeBaseUrl = (value) => {
  if (!value) return DEFAULT_API_BASE_URL;
  return value.endsWith('/') ? value.slice(0, -1) : value;
};

const API_BASE_URL = normalizeBaseUrl(configuredApiBaseUrl);
const HTML_DOCTYPE_PATTERN = /^\s*<!doctype html/i;
const HTML_TAG_PATTERN = /^\s*<html/i;

const isHtmlResponse = (text, contentType = '') =>
  contentType.includes('text/html') ||
  HTML_DOCTYPE_PATTERN.test(text) ||
  HTML_TAG_PATTERN.test(text);

const buildRequestUrls = (path) => {
  const primary = `${API_BASE_URL}${path}`;
  const fallback = `${DEFAULT_API_BASE_URL}${path}`;
  if (primary === fallback) return [primary];

  const shouldTryFallback = /^https?:\/\//i.test(API_BASE_URL);
  return shouldTryFallback ? [primary, fallback] : [primary];
};

export async function apiFetch(path, options = {}) {
  const token = localStorage.getItem('accessToken');

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const urls = buildRequestUrls(path);
  let response = null;
  let networkError = null;

  for (const url of urls) {
    try {
      response = await fetch(url, {
        ...options,
        headers,
        credentials: options.credentials || 'include',
      });
      break;
    } catch (error) {
      networkError = error;
    }
  }

  if (!response) {
    throw networkError || new Error('Failed to fetch');
  }

  if (!response.ok) {
    const contentType = response.headers.get('content-type') || '';
    const text = await response.text();
    let detail = text;
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed?.message)) {
        detail = parsed.message.join(", ");
      } else if (typeof parsed?.message === "string") {
        detail = parsed.message;
      } else if (text) {
        detail = text;
      } else {
        detail = `HTTP ${response.status}`;
      }
    } catch {
      if (isHtmlResponse(text, contentType)) {
        detail = 'API가 JSON 대신 HTML을 반환했습니다. 서버 라우팅(/api) 또는 배포 구성을 확인해 주세요.';
      } else {
        detail = text || `HTTP ${response.status}`;
      }
    }

    const error = new Error(detail);
    error.status = response.status;
    throw error;
  }

  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get('content-type') || '';
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    const message = isHtmlResponse(text, contentType)
      ? 'API가 JSON 대신 HTML을 반환했습니다. 서버 라우팅(/api) 또는 배포 구성을 확인해 주세요.'
      : '서버 응답이 JSON 형식이 아닙니다.';
    throw new Error(message);
  }
}
