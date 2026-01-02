import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});


api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response) {
      throw {
        status: error.response.status,
        data: error.response.data,
      };
    }
    throw {
      status: 0,
      data: { non_field_errors: ["Network error, please try again"] },
    };
  }
);


export const apiGet = async <T>(path: string): Promise<T> => {
  const response = await api.get<T>(path);
  return response as unknown as T;
};


export const apiPost = <T>(path: string, data: any): Promise<T> => api.post(path, data);

export const apiPatch = (path: string, data: any) => api.patch(path, data);

export const apiDelete = (path: string) => api.delete(path);

export default api;
