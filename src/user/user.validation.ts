/* eslint-disable prettier/prettier */
import z from 'zod';

/* eslint-disable prettier/prettier */
export type RegisterRequest = {
  name: string;
  email: string;
  password: string;
};

export type RegisterResponse = {
  name: string;
  id: number;
  message?: string;
};

export type LoginRequest = {
  name?: string;
  sub?: string;
  email: string;
  password: string;
};

export type LoginResponse = {
  id: number;
  name: string;
  email: string;
  token?: string;
};
export type WebResponse<T> = {
  data?: T;
  error?: string;
};
export type GetUserRequest = {
  id: number;
};
export type GetUserResponse = {
  id: number;
  name: string;
  email: string;
  avatar?: string;
};
export class UserValidation {
  static readonly REGISTER = z.object({
    name: z.string().min(1).max(100),
    email: z.string().min(1).max(100),
    googleId: z.string().optional(),
    password: z.string().min(6).max(100),
  });

  static readonly LOGIN = z.object({
    email: z.string().min(1).max(100),
    password: z.string().min(6).max(100).optional(),
    aud: z.string().optional(),
  });
}
