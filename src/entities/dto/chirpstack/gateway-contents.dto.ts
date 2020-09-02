import { ApiProperty, ApiHideProperty } from "@nestjs/swagger";
import {
    IsString,
    MinLength,
    MaxLength,
    IsOptional,
    Matches,
    ValidateNested,
    IsJSON,
} from "class-validator";
import { CommonLocationDto } from "@dto/chirpstack/common-location.dto";
import { ChirpstackBoardsDto } from "@dto/chirpstack/chirpstack-boards.dto";
import { Type } from "class-transformer";

export class GatewayContentsDto {
    @ApiProperty({
        required: false,
        default: [],
        type: [ChirpstackBoardsDto],
    })
    @IsOptional()
    @ValidateNested({ each: true })
    @Type(() => ChirpstackBoardsDto)
    boards?: ChirpstackBoardsDto[];

    @ApiProperty({ required: true })
    @IsOptional()
    @IsString()
    @MaxLength(1024)
    description?: string;

    @ApiProperty({ required: false, default: false })
    @IsOptional()
    discoveryEnabled: boolean;

    @ApiHideProperty()
    gatewayProfileID?: string;

    @ApiProperty({ required: true })
    @IsString()
    @Matches(/[0-9A-Fa-f]{16}/)
    id: string;

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
    @Matches(/^[a-zA-Z0-9\-]+$/, {
        message: "The name may only contain words, numbers and dashes.",
    })
    name: string;

    @ApiHideProperty()
    networkServerID: string;

    @ApiHideProperty()
    organizationID: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsJSON()
    tagsString?: string;

    @ApiHideProperty()
    tags?: JSON;
    
}
