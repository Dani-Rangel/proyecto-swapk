// frontend/src/services/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
});

// ✅ Nueva función para reemplazar fetch() con soporte de headers y métodos
export async function fetchApi(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = `${process.env.NEXT_PUBLIC_API_URL}${endpoint}`;
  return fetch(url, {
    credentials: 'include',
    ...options,
  });
}

export default api;
