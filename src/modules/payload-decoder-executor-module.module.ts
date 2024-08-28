import { Module } from "@nestjs/common";
import { PayloadDecoderExecutorService } from "@services/data-management/payload-decoder-executor.service";

@Module({
  providers: [PayloadDecoderExecutorService],
  exports: [PayloadDecoderExecutorService],
})
export class PayloadDecoderExecutorModuleModule {}
