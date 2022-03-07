import { SharedModule } from "@modules/shared.module";
import { Module } from "@nestjs/common";
import { ControlledPropertyService } from "@services/device-management/controlled-property.service";

@Module({
    imports: [SharedModule],
    exports: [ControlledPropertyService],
    providers: [ControlledPropertyService],
})
export class ControlledPropertyModule {}
