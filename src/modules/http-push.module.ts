import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { HttpPush } from "@entities/http-push.entity";
import { HttpPushController } from "@admin-controller/http-push.controller";
import { HttpPushService } from "@services/http-push.service";

@Module({
    imports: [
        TypeOrmModule.forFeature([HttpPush]),
    ],
    exports: [TypeOrmModule],
    controllers: [HttpPushController],
    providers: [HttpPushService],
})
export class HttpPushModule { }
