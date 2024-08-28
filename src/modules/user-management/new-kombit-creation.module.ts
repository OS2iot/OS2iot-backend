import { Module } from "@nestjs/common";

import { SharedModule } from "@modules/shared.module";
import { NewKombitCreationController } from "@user-management-controller/new-kombit-creation.controller";
import { OrganizationModule } from "./organization.module";
import { UserModule } from "./user.module";
import { PermissionModule } from "./permission.module";

@Module({
  imports: [SharedModule, OrganizationModule, UserModule, PermissionModule],
  controllers: [NewKombitCreationController],
})
export class NewKombitCreationModule {}
