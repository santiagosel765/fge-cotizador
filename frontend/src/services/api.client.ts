import axios, { AxiosError } from 'axios';
import { API_BASE_URL } from '@/lib/constants';
import { ApiError } from '@/types/api.types';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // TODO: implementar refresh token / redirección login.
    }

    const apiError: ApiError = {
      statusCode: error.response?.status || 500,
      message: (error.response?.data as { message?: string })?.message || error.message,
      details: error.response?.data,
    };

    return Promise.reject(apiError);
  },
);
