import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Endpoint } from "@entities/endpoint.entity";
import { EndpointController } from "@admin-controller/endpoint.controller";
import { EndpointService } from "@services/endpoint.service";

@Module({
    imports: [
        TypeOrmModule.forFeature([Endpoint]),
    ],
    exports: [TypeOrmModule],
    controllers: [EndpointController],
    providers: [EndpointService],
})
export class EndpointModule { }
