import { Module } from "@nestjs/common";
import { DefaultController } from "@admin-controller/default.controller";
import { AuthModule } from "../auth/auth.module";

@Module({
    imports: [AuthModule],
    controllers: [DefaultController],
})
export class DefaultModule {}
