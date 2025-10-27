/* eslint-disable prettier/prettier */
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() // biar bisa diakses di semua module tanpa import manual
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
