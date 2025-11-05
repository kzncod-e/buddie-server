/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable prettier/prettier */
import { HttpException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma.service';
import {
  GetUserRequest,
  GetUserResponse,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  UserValidation,
} from './user.validation';
import { ValidationService } from 'src/common/validation.service';
import * as bcrypt from 'bcrypt';
import { signToken } from 'lib/jwt';
import { User } from '@prisma/client';
import { Response } from 'express';

@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
    private validationService: ValidationService,
  ) {}
  private setAuthCookie(res: Response, token: string) {
    res.cookie('token', token, {
      httpOnly: true,
      secure: false, // penting: false di localhost
      sameSite: 'lax', // biar cookie bisa dikirim cross-origin
      path: '/', // pastikan berlaku global
    });
  }

  async createUser(request: RegisterRequest): Promise<RegisterResponse> {
    console.log(request);
    const registerRequest = this.validationService.validate(
      UserValidation.REGISTER,
      request,
    );
    const uniqueUser = await this.prisma.user.count({
      where: {
        name: registerRequest.name,
      },
    });
    if (uniqueUser != 0) {
      throw new HttpException('User with this name already exist', 400);
    }
    registerRequest.password = await bcrypt.hash(registerRequest.password, 10);
    const newUser = await this.prisma.user.create({
      data: registerRequest,
    });
    return {
      name: newUser.name!,
      id: newUser.id,
    };
  }
  async login(
    request: LoginRequest,
    res: Response,
  ): Promise<LoginResponse | undefined> {
    const loginRequest = this.validationService.validate(
      UserValidation.LOGIN,
      request,
    );
    console.log(request);
    

    let user: User | null = null;
    if (request.sub) {
      user = await this.prisma.user.upsert({
        where: { googleId: request.sub },
        update: { email: request.email, googleId: request.sub },
        create: {
          email: request.email,
          googleId: request.sub,
          name: request.name || 'Google User',
        },
      });
    }
    user = await this.prisma.user.findFirst({
      where: {
        email: loginRequest.email,
      },
    });
    if (!user) throw Error('Invalid email or password');
    const token = signToken({ id: user.id, email: user.email });
    if (!token) throw Error('Token generation failed');
    this.setAuthCookie(res, token);
    console.log(user, 'ini user di service');

    return {
      id: user.id,
      name: user.name ?? '',
      email: user.email,
      token: token,
    };
  }
  async getUserById(request: GetUserRequest): Promise<GetUserResponse | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: request.id },
    });
    if (!user) return null;
    return {
      id: user.id,
      name: user.name ?? '',
      email: user.email ?? '',
    };
  }
}
