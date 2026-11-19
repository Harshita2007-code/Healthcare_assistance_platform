import { request } from './api';
export const assistantApi = {
  status: () => request('/assistant/status'),
  send: data => request('/assistant/messages', { method: 'POST', body: data }),
  history: () => request('/assistant/history'),
  clearHistory: () => request('/assistant/history', { method: 'DELETE' }),
};
