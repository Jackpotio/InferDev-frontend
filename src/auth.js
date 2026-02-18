import { apiFetch } from './api';

export async function register(email, password) {
  const data = await apiFetch('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  localStorage.setItem('accessToken', data.accessToken);
  return data.user;
}

export async function login(email, password) {
  const data = await apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  localStorage.setItem('accessToken', data.accessToken);
  return data.user;
}

export async function getMe() {
  return apiFetch('/auth/me');
}

export async function getProfile() {
  return apiFetch('/auth/profile');
}

export async function updateProfile(payload) {
  return apiFetch('/auth/profile', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function logout() {
  localStorage.removeItem('accessToken');
}
