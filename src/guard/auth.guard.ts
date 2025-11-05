/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { Request } from 'express';
import { verifyToken } from 'lib/jwt';

// Extend Express Request interface to include 'user'
declare module 'express-serve-static-core' {
  interface Request {
    user?: any;
  }
}

@Injectable()
export class AuthGuard implements CanActivate {
  private extractToken(request: Request): string | undefined {
    // 1. Ambil dari Authorization header
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    if (type === 'Bearer' && token) return token;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return request.cookies?.token; // pastikan nama cookienya sama kayak waktu set-cookie
  }
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    console.log(request.cookies, 'ini cookies di guard');

    const token = this.extractToken(request);
    if (!token) {
      throw new UnauthorizedException('Token not found');
    }
    try {
      const payload = verifyToken(token);
      console.log('Payload dari JWT:', payload);
      // Simpan info user dari payload ke request object biar bisa diakses di controller/service

      if (!payload) {
        throw new UnauthorizedException('Invalid token payload');
      }
      // harus periksa data response nya gimana agar saar dipakai di controller sesuai
      request.user = payload.data;
    } catch (err) {
      throw new UnauthorizedException('Invalid token');
    }
    return true;
  }
}
