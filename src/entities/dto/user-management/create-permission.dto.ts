import { PermissionType } from "@entities/enum/permission-type.enum";
import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsNumber, IsString, Length } from "class-validator";

export class CreatePermissionDto {
    @ApiProperty({
        required: true,
        enum: PermissionType,
    })
    @IsEnum(PermissionType)
    level:
        | PermissionType.OrganizationUserAdmin
        | PermissionType.OrganizationGatewayAdmin
        | PermissionType.OrganizationApplicationAdmin
        | PermissionType.Read;

    @ApiProperty({ required: true })
    @IsString()
    @Length(1, 1024)
    name: string;

    @ApiProperty({ required: true })
    @IsNumber()
    organizationId: number;

    @ApiProperty({
        required: true,
        type: "array",
        items: {
            type: "number",
        },
    })
    userIds: number[];

    @ApiProperty({
        required: true,
        type: "array",
        items: {
            type: "number",
        },
    })
    applicationIds?: number[];

    @ApiProperty({ required: false })
    automaticallyAddNewApplications?: boolean;
}
