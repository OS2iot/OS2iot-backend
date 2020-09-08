import { Module } from '@nestjs/common';
import { PermissionService } from './permission.service';
import { PermissionController } from './permission.controller';

@Module({
  providers: [PermissionService],
  controllers: [PermissionController]
})
export class PermissionModule {}
