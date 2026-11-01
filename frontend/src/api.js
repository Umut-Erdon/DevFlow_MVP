const API = 'http://localhost:5080/api';
export function getToken(){ return localStorage.getItem('devflow_token'); }
export async function api(path, options = {}) {
  const token = getToken();
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(options.headers || {}) }
  });
  if (response.status === 204) return null;
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || data.title || 'İşlem başarısız.');
  return data;
}
