import { ApplicationStatus } from "@enum/application-status.enum";
import { ControlledPropertyTypes } from "@enum/controlled-property.enum";
import { ApplicationDeviceTypes, ApplicationDeviceTypeUnion } from "@enum/device-type.enum";
import { ValidateDate } from "@helpers/date.validator";
import { IsSwaggerOptional } from "@helpers/optional-validator";
import { IsPhoneNumberString } from "@helpers/phone-number.validator";
import { nameof } from "@helpers/type-helper";
import { ApiProperty } from "@nestjs/swagger";
import {
    ArrayUnique,
    IsArray,
    IsBoolean,
    IsEnum,
    IsOptional,
    IsString,
    MaxLength,
    MinLength,
} from "class-validator";

export class CreateApplicationDto {
    @ApiProperty({ required: true })
    @IsString()
    @MinLength(1)
    @MaxLength(50)
    name: string;

    @ApiProperty({ required: true })
    organizationId: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    @MaxLength(1024)
    description?: string;

    @IsSwaggerOptional()
    @IsEnum(ApplicationStatus)
    status?: ApplicationStatus;

    @IsSwaggerOptional()
    @ValidateDate()
    startDate?: Date;

    @IsSwaggerOptional()
    @ValidateDate()
    endDate?: Date;

    @IsSwaggerOptional()
    @IsString()
    @MaxLength(100)
    category?: string;

    @IsSwaggerOptional()
    @IsString()
    @MaxLength(100)
    owner?: string;

    @IsSwaggerOptional()
    @IsString()
    @MaxLength(100)
    contactPerson?: string;

    @IsSwaggerOptional()
    @IsString()
    @MaxLength(100)
    contactEmail?: string;

    @IsSwaggerOptional()
    @IsPhoneNumberString(nameof<CreateApplicationDto>("contactPhone"))
    @MaxLength(12)
    contactPhone?: string;

    @IsSwaggerOptional()
    @IsBoolean()
    personalData?: boolean;

    @IsSwaggerOptional()
    @IsString()
    @MaxLength(1024)
    hardware?: string;

    @IsSwaggerOptional()
    @IsArray()
    @ArrayUnique()
    @IsEnum(ControlledPropertyTypes, { each: true })
    controlledProperties?: ControlledPropertyTypes[];

    @IsSwaggerOptional()
    @IsArray()
    @ArrayUnique()
    @IsEnum(ApplicationDeviceTypes, { each: true })
    deviceTypes?: ApplicationDeviceTypeUnion[];

    @ApiProperty({
        required: false,
        type: "array",
        items: {
            type: "number",
        },
    })
    permissionIds?: number[];
}
