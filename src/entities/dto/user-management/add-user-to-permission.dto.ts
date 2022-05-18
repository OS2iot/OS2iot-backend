import { PermissionType } from "@enum/permission-type.enum";
import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsNumber } from "class-validator";
import { omit } from "lodash";

const globalAdminEnumName: keyof typeof PermissionType = 'GlobalAdmin';
const acceptablePermissionType = omit(PermissionType, globalAdminEnumName);

export class PermissionRequestAcceptUser {
    @ApiProperty({ required: true })
    @IsNumber()
    organizationId: number;

    @ApiProperty({ required: true })
    @IsNumber()
    userId: number;

    @ApiProperty({
        required: true,
        enum: acceptablePermissionType,
    })
    @IsEnum(acceptablePermissionType)
    level: keyof typeof acceptablePermissionType;
}
