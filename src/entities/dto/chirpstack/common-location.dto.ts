import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

export class CommonLocationDto {
    @ApiProperty({ required: true })
    longitude: number;

    @ApiProperty({ required: true })
    latitude: number;

    @ApiProperty({ required: false })
    @IsOptional()
    altitude?: number;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    source?:
        | "UNKNOWN"
        | "GPS"
        | "CONFIG"
        | "GEO_RESOLVER_TDOA"
        | "GEO_RESOLVER_RSSI"
        | "GEO_RESOLVER_GNSS"
        | "GEO_RESOLVER_WIFI";

    @ApiProperty({ required: false })
    @IsOptional()
    accuracy?: number;
}
