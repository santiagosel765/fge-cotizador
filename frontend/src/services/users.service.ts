import { api } from '@/lib/api';
import { AuthUser, UserRole } from '@/lib/auth';

export interface UserRecord extends AuthUser {
  phone?: string | null;
  createdAt?: string;
}

export interface CreateUserDto {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
  role: UserRole;
}

export interface UpdateUserDto {
  fullName: string;
  email: string;
  phone?: string;
  role: UserRole;
}

export interface ChangePasswordDto {
  currentPassword?: string;
  newPassword: string;
  confirmNewPassword: string;
}

function authHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
  };
}

export const usersService = {
  async listUsers(search: string | undefined, token: string): Promise<UserRecord[]> {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    return api.get<UserRecord[]>(`/users${query}`, {
      headers: authHeaders(token),
    });
  },

  async createUser(dto: CreateUserDto, token: string): Promise<UserRecord> {
    return api.post<UserRecord>('/users', dto, {
      headers: authHeaders(token),
    });
  },

  async updateUser(id: string, dto: UpdateUserDto, token: string): Promise<UserRecord> {
    return api.patch<UserRecord>(`/users/${id}`, dto, {
      headers: authHeaders(token),
    });
  },

  async changePassword(id: string, dto: ChangePasswordDto, token: string): Promise<void> {
    await api.patch<void>(`/users/${id}/password`, dto, {
      headers: authHeaders(token),
    });
  },

  async deleteUser(id: string, token: string): Promise<void> {
    await api.delete<void>(`/users/${id}`, {
      headers: authHeaders(token),
    });
  },
};
