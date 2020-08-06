import { ApiProperty } from "@nestjs/swagger";
import { IsString, MinLength, MaxLength, IsOptional } from "class-validator";

export class CreateNetworkServerDto {
    @ApiProperty({ required: true })
    @IsString()
    @MaxLength(1024)
    name: string;

    @ApiProperty({ required: true })
    @IsString()
    @MaxLength(1024)
    server: string;

    @ApiProperty({ required: false })
    @IsOptional()
    id?: number;

    @ApiProperty({ required: false })
    @IsString()
    @MinLength(1)
    @MaxLength(50)
    caCert?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    gatewayDiscoveryDR?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    gatewayDiscoveryEnabled?: boolean;

    @ApiProperty({ required: false })
    @IsOptional()
    gatewayDiscoveryInterval?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    gatewayDiscoveryTXFrequency?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    @MaxLength(1024)
    routingProfileCACert?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    @MaxLength(1024)
    routingProfileTLSCert?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    @MaxLength(1024)
    routingProfileTLSKey?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    @MaxLength(1024)
    tlsCert?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    @MaxLength(1024)
    tlsKey?: string;
}
