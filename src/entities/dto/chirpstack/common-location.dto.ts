import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsOptional, Max, Min, IsNumber } from "class-validator";

export class CommonLocationDto {
    @ApiProperty({ required: false })
    @IsOptional()
    longitude?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    latitude?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    altitude?: number;

    @ApiProperty({ required: false })
    @IsString()
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
