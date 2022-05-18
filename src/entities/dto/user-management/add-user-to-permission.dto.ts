import { PermissionType } from "@enum/permission-type.enum";
import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsNumber } from "class-validator";

export class PermissionRequestAcceptUser {
    @ApiProperty({ required: true })
    @IsNumber()
    organizationId: number;

    @ApiProperty({ required: true })
    @IsNumber()
    userId: number;

    @ApiProperty({
        required: true,
        enum: PermissionType,
    })
    @IsEnum(PermissionType)
    level: "OrganizationAdmin" | "Write" | "Read";
}
