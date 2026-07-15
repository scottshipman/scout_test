import axios from 'axios';
import { apiClient } from './client';
import type {
  ApiErrorBody,
  CreateUserPayload,
  UpdateUserPayload,
  User,
  UserListResponse,
  UserResponse,
} from '../types/user';

// Wrapping every API call's error into one shape so components don't need
// to know anything about axios - just message + optional field errors.
export class ApiError extends Error {
  status: number;
  fieldErrors?: Record<string, string>;

  constructor(message: string, status: number, fieldErrors?: Record<string, string>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

function toApiError(error: unknown): ApiError {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    const status = error.response?.status ?? 0;
    const body = error.response?.data;
    if (body) {
      return new ApiError(body.message, status, body.errors);
    }
    return new ApiError(error.message || 'Network error, please try again.', status);
  }
  return new ApiError('An unexpected error occurred.', 0);
}

export async function fetchUsers(page: number, limit: number): Promise<UserListResponse> {
  try {
    const response = await apiClient.get<UserListResponse>('/users', {
      params: { page, limit },
    });
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
}

export async function fetchUser(id: string): Promise<User> {
  try {
    const response = await apiClient.get<UserResponse>(`/users/${id}`);
    return response.data.data;
  } catch (error) {
    throw toApiError(error);
  }
}

export async function createUser(payload: CreateUserPayload): Promise<User> {
  try {
    const response = await apiClient.post<UserResponse>('/users', payload);
    return response.data.data;
  } catch (error) {
    throw toApiError(error);
  }
}

export async function updateUser(id: string, payload: UpdateUserPayload): Promise<User> {
  try {
    const response = await apiClient.put<UserResponse>(`/users/${id}`, payload);
    return response.data.data;
  } catch (error) {
    throw toApiError(error);
  }
}

export async function deleteUser(id: string): Promise<void> {
  try {
    await apiClient.delete(`/users/${id}`);
  } catch (error) {
    throw toApiError(error);
  }
}
