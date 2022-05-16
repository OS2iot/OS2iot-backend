import { PermissionType } from "@enum/permission-type.enum";
import { IsEnum } from "class-validator";

export class PermissionTypeDto {
    @IsEnum(PermissionType)
    type: PermissionType;
}
