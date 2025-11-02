/* eslint-disable prettier/prettier */
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { ValidationService } from './validation.service';
import { APP_FILTER } from '@nestjs/core';
import { Errorfilter } from './error.filter';

@Global() // biar bisa diakses di semua module tanpa import manual
@Module({
  providers: [
    PrismaService,
    ValidationService,
    {
      provide: APP_FILTER,
      useClass: Errorfilter,
    },
  ],
  exports: [PrismaService, ValidationService],
})
export class CommonModule {}
