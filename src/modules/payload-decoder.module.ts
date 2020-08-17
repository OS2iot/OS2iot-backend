import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PayloadDecoder } from "@entities/payload-decoder.entity";
import { PayloadDecoderService } from "@services/payload-decoder.service";
import { PayloadDecoderController } from "@admin-controller/payload-decoder.controller";
import { PayloadTransformerListenerService } from "@services/payload-transformer.service";
import { KafkaModule } from "@modules/kafka.module";

@Module({
    imports: [TypeOrmModule.forFeature([PayloadDecoder]), KafkaModule],
    exports: [TypeOrmModule],
    controllers: [PayloadDecoderController],
    providers: [PayloadDecoderService, PayloadTransformerListenerService],
})
export class PayloadDecoderModule {}
