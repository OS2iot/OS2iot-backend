import { ApiProperty } from "@nestjs/swagger";
import {
    IsString,
    MinLength,
    MaxLength,
    IsOptional,
    IsJSON,
} from "class-validator";
import { CommonLocationDto } from "@dto/chirpstack/common-location.dto";
import { ChirpstackBoardsDto } from "@dto/chirpstack/chirpstack-boards.dto";

export class GatewayContentsDto {
    @ApiProperty({ required: false })
    @IsOptional()
    boards?: ChirpstackBoardsDto[];

    @ApiProperty({ required: true })
    @IsOptional()
    @IsString()
    @MaxLength(1024)
    description?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    discoveryEnabled = false;

    @ApiProperty({ required: false })
    @IsOptional()
    gatewayProfileID?: string = null;

    @ApiProperty({ required: true })
    @IsString()
    id: string;

    @ApiProperty({ required: false })
    location: CommonLocationDto;

    @ApiProperty({ required: false })
    metadata?: JSON;

    @ApiProperty({ required: true })
    @IsString()
    @MinLength(1)
    @MaxLength(50)
    name: string;

    @ApiProperty({ required: true })
    @IsString()
    networkServerID: string;

    @ApiProperty({ required: true })
    @IsString()
    organizationID: string;

    @ApiProperty({ required: false })
    tags?: JSON;
}
