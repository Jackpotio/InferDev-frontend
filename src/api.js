const DEFAULT_API_BASE_URL = '/api';
const configuredApiBaseUrl = (process.env.REACT_APP_API_URL || DEFAULT_API_BASE_URL).trim();

const normalizeBaseUrl = (value) => {
  if (!value) return DEFAULT_API_BASE_URL;
  return value.endsWith('/') ? value.slice(0, -1) : value;
};

const API_BASE_URL = normalizeBaseUrl(configuredApiBaseUrl);

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
      detail = text || `HTTP ${response.status}`;
    }

    const error = new Error(detail);
    error.status = response.status;
    throw error;
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}
