import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PayloadDecoder } from "@entities/payload-decoder.entity";
import { PayloadDecoderService } from "@services/payload-decoder.service";
import { PayloadDecoderController } from "@admin-controller/payload-decoder.controller";

@Module({
    imports: [TypeOrmModule.forFeature([PayloadDecoder])],
    exports: [TypeOrmModule],
    controllers: [PayloadDecoderController],
    providers: [PayloadDecoderService],
})
export class PayloadDecoderModule {}
