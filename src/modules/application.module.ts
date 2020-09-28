import { forwardRef, Module } from "@nestjs/common";
import { ApplicationController } from "@admin-controller/application.controller";
import { ApplicationService } from "@services/application.service";
import { OrganizationModule } from "./organization.module";
import { SharedModule } from "@modules/shared.module";

@Module({
    imports: [SharedModule, forwardRef(() => OrganizationModule)],
    exports: [ApplicationService],
    controllers: [ApplicationController],
    providers: [ApplicationService],
})
export class ApplicationModule {}
