let sessionEpoch = 0;
export const advanceSessionEpoch = () => { sessionEpoch++; };
export const currentSessionEpoch = () => sessionEpoch;
export function notifySessionExpired(status, code, epoch) {
  if (status === 401 && code === 'UNAUTHENTICATED' && epoch === sessionEpoch && typeof window !== 'undefined') {
    window.dispatchEvent(new Event('sahaara-session-expired'));
  }
}
export async function request(path, { method = 'GET', body, signal } = {}) {
  const epoch = currentSessionEpoch();
  let response;
  try {
    response = await fetch(`/api${path}`, {
      signal,
      method,
      credentials: 'same-origin',
      headers: method === 'GET' ? {} : { 'Content-Type': 'application/json', 'X-Requested-With': 'Sahaara-Web' },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
  } catch {
    if (signal?.aborted) throw new DOMException('Request aborted', 'AbortError');
    throw new Error('Cannot reach the server. Please check your connection and try again.');
  }
  const data = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(data?.error?.message || 'The service is temporarily unavailable.');
    error.code = data?.error?.code;
    error.status = response.status;
    notifySessionExpired(error.status, error.code, epoch);
    throw error;
  }
  return data;
}
export const authApi = {
  register: data => request('/auth/register', { method: 'POST', body: data }),
  login: data => request('/auth/login', { method: 'POST', body: data }),
  logout: () => request('/auth/logout', { method: 'POST', body: {} }),
  me: () => request('/auth/me'),
  updateProfile: data => request('/auth/me', { method: 'PATCH', body: data }),
};
export function profilePayload(profile) {
  const keys = ['name', 'age', 'gender', 'state', 'district', 'occupation', 'income', 'language', 'familySize', 'residence', 'category'];
  return Object.fromEntries(keys.map(key => [key, profile[key] ?? '']));
}
