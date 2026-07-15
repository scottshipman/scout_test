export const USER_ROLES = ['admin', 'manager', 'user'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const USER_STATUSES = ['active', 'inactive', 'pending'] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

export interface UserListMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface UserListResponse {
  data: User[];
  meta: UserListMeta;
}

export interface UserResponse {
  data: User;
}

export interface CreateUserPayload {
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  status: UserStatus;
}

export type UpdateUserPayload = Partial<CreateUserPayload>;

export interface ApiErrorBody {
  message: string;
  errors?: Record<string, string>;
}
