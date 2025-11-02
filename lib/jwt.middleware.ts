/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { verifyToken } from './jwt';
import { JwtPayload } from 'jsonwebtoken';

@Injectable()
export class JwtMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const token: string = req.cookies?.['token']; // ambil dari cookie

    if (!token) throw new UnauthorizedException('No token provided');

    try {
      const decoded = verifyToken(token);
      (req as JwtPayload).user = decoded;
      next();
    } catch (err) {
      throw new UnauthorizedException('Invalid or expired token', err);
    }
  }
}
