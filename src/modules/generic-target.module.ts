import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { GenericTarget } from "@entities/generic-target.entity";
import { GenericTargetController } from "@admin-controller/generic-target.controller";
import { GenericTargetService } from "@services/generic-target.service";

@Module({
    imports: [
        TypeOrmModule.forFeature([GenericTarget]),
    ],
    exports: [TypeOrmModule],
    controllers: [GenericTargetController],
    providers: [GenericTargetService],
})
export class GenericTargetModule { }
