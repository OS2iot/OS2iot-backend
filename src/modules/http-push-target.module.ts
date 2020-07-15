import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { HttpPushTarget } from "@entities/http-push-target.entity";
import { HttpPushTargetController } from "@admin-controller/http-push-target.controller";
import { HttpPushTargetService } from "@services/http-push-target.service";

@Module({
    imports: [
        TypeOrmModule.forFeature([HttpPushTarget]),
    ],
    exports: [TypeOrmModule],
    controllers: [HttpPushTargetController],
    providers: [HttpPushTargetService],
})
export class HttpPushTargetModule { }
