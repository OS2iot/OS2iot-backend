import { Module } from "@nestjs/common";
import { CsrfController } from "@user-management-controller/csrf.controller";

@Module({
  imports: [],
  providers: [],
  exports: [],
  controllers: [CsrfController],
})
export class CsrfModule {}
