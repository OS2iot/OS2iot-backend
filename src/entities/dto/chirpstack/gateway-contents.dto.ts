import { ApiHideProperty, ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
    IsHexadecimal,
    IsJSON,
    IsOptional,
    IsString,
    Length,
    Matches,
    MaxLength,
    MinLength,
    ValidateNested,
} from "class-validator";
import { CommonLocationDto } from "@dto/chirpstack/common-location.dto";

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

    @ApiHideProperty()
    tenantId: string;

    @ApiProperty({ required: false })
    @IsJSON()
    tagsString?: string;

    @ApiHideProperty()
    tags?: { [id: string]: string };

    @ApiHideProperty()
    gatewayProfileID?: string;

    @ApiHideProperty()
    id: string;
}
