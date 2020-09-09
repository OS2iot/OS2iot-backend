import { CreatePermissionDto } from "./create-permission.dto";
import { OmitType } from "@nestjs/swagger";

export class UpdatePermissionDto extends OmitType(CreatePermissionDto, [
    "organizationId",
    "level",
]) {}
