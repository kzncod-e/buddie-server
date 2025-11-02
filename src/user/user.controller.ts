/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable prettier/prettier */
import {
  Body,
  Controller,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import * as userValidation from './user.validation';
import express from 'express';
import { AuthGuard } from 'src/guard/auth.guard';

@Controller()
export class UserController {
  constructor(private userService: UserService) {}
  @Post('/api/register')
  async register(
    @Body() request: userValidation.RegisterRequest,
  ): Promise<userValidation.WebResponse<userValidation.RegisterResponse>> {
    const result = await this.userService.createUser(request);
    return {
      data: result,
    };
  }
  @Post('/api/login')
  async login(
    @Body() request: userValidation.LoginRequest,
    @Res({ passthrough: true }) res: express.Response,
  ): Promise<void> {
    const result = await this.userService.login(request, res);
    res.status(200).json({
      data: result,
    });
  }

  @UseGuards(AuthGuard)
  @Post('/api/user')
  async getUser(
    @Req() request: Request & { user?: { id?: number } },
  ): Promise<userValidation.WebResponse<userValidation.GetUserResponse>> {
    const user = request.user;
    const id = user?.id;
    if (!request.user?.id)
      // harus lewat data dulu karena di payload JWT, id nya di dalem data
      throw new UnauthorizedException('User ID not found');
    const result = await this.userService.getUserById({ id: id! });
    return {
      data: result ?? undefined,
    };
  }
}
