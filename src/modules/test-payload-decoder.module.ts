import { Module } from "@nestjs/common";
import { TestPayloadDecoderController } from "@admin-controller/test-payload-decoder.controller";
import { PayloadDecoderExecutorModuleModule } from "@modules/payload-decoder-executor-module.module";

@Module({
    imports: [PayloadDecoderExecutorModuleModule],
    controllers: [TestPayloadDecoderController],
})
export class TestPayloadDecoderModule {}
