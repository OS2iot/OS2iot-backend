import { ApiHideProperty, ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
    IsEmail,
    IsEnum,
    IsHexadecimal,
    IsJSON,
    IsOptional,
    IsPhoneNumber,
    IsString,
    Length,
    Matches,
    MaxLength,
    MinLength,
    ValidateNested,
} from "class-validator";
import { CommonLocationDto } from "@dto/chirpstack/common-location.dto";
import { GatewayPlacement, GatewayStatus } from "@enum/gateway.enum";

export class GatewayContentsDto {
    @ApiProperty({ required: true })
    @IsOptional()
    @IsString()
    @MaxLength(1024)
    description?: string;

    @ApiProperty({ required: false, default: false })
    @IsOptional()
    discoveryEnabled: boolean;

    @ApiProperty({ required: true })
    @IsString()
    @IsHexadecimal()
    @Length(16, 16)
    gatewayId: string;

    @ApiProperty({ required: false })
    @ValidateNested({ each: true })
    @Type(() => CommonLocationDto)
    location: CommonLocationDto;

    @ApiProperty({ required: false })
    metadata?: JSON;

    @ApiProperty({ required: true })
    @IsString()
    @MinLength(1)
    @MaxLength(50)
    @Matches(/^[a-zA-Z0-9\-_]+$/, {
        message: "The name may only contain words, numbers and dashes.",
    })
    name: string;

    @ApiProperty({ required: false })
    @IsEnum(GatewayPlacement)
    @IsOptional()
    placement?: GatewayPlacement;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    modelName?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    antennaType?: string;

    @ApiProperty({ required: false })
    @IsEnum(GatewayStatus)
    @IsOptional()
    status?: GatewayStatus;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    gatewayResponsibleName?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    @IsEmail()
    gatewayResponsibleEmail?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    @IsPhoneNumber("DK")
    gatewayResponsiblePhoneNumber?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    operationalResponsibleName?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    @IsEmail()
    operationalResponsibleEmail?: string;

    @ApiHideProperty()
    tenantId: string;

    @ApiProperty({ required: false })
    @IsJSON()
    tagsString?: string;

    @ApiHideProperty()
    tags?: { [id: string]: string };

    @ApiHideProperty()
    id: string;
}
