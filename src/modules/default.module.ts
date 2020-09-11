import { Module } from "@nestjs/common";
import { DefaultController } from "@admin-controller/default.controller";

@Module({
    controllers: [DefaultController],
})
export class DefaultModule {}
