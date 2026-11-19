import { request } from './api';
export const schemeApi = {
  list: (filters = {}, signal) => {
    const params = new URLSearchParams(Object.entries(filters).filter(([,value]) => value));
    return request(`/schemes${params.size ? `?${params}` : ''}`, { signal });
  },
  detail: slug => request(`/schemes/${encodeURIComponent(slug)}`),
  saved: () => request('/schemes/saved'),
  save: slug => request(`/schemes/${encodeURIComponent(slug)}/saved`, { method: 'PUT' }),
  unsave: slug => request(`/schemes/${encodeURIComponent(slug)}/saved`, { method: 'DELETE' }),
};
