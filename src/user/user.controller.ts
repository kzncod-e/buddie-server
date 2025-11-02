/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable prettier/prettier */
import { Body, Controller, Post } from '@nestjs/common';
import { UserService } from './user.service';
import * as userValidation from './user.validation';

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
  ): Promise<userValidation.WebResponse<userValidation.LoginResponse>> {
    const result = await this.userService.login(request);
    return { data: result };
  }
}
