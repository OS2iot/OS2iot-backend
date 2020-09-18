import { PermissionType } from "@entities/enum/permission-type.enum";
import { ApiProperty } from "@nestjs/swagger";

export class CreatePermissionDto {
    @ApiProperty({ required: true })
    level:
        | PermissionType.OrganizationAdmin
        | PermissionType.Write
        | PermissionType.Read;

    @ApiProperty({ required: true })
    name: string;

    @ApiProperty({ required: false })
    organizationId?: number;

    @ApiProperty({
        required: true,
        type: "array",
        items: {
            type: "number",
        },
    })
    userIds: number[];
}
