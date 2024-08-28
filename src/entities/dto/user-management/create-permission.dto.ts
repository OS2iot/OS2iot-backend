import { PermissionType } from "@entities/enum/permission-type.enum";
import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsString, Length, ValidateNested, IsArray, ArrayUnique } from "class-validator";
import { PermissionTypeDto } from "./permission-type.dto";
import { Type } from "class-transformer";
import { ArrayDistinct } from "@helpers/array-distinct.validator";
import { nameof } from "@helpers/type-helper";

export class CreatePermissionDto {
    @ApiProperty({
        required: true,
        enum: PermissionType,
    })
    @IsArray()
    @ArrayDistinct(nameof<PermissionTypeDto>("type"))
    @Type(() => PermissionTypeDto)
    @ValidateNested({ each: true })
    levels: PermissionTypeDto[];

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
