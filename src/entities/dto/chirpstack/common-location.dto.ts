import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString, Max, Min } from "class-validator";

export class CommonLocationDto {
    @ApiProperty({ required: true })
    @Max(180.0)
    @Min(-180.0)
    longitude: number;

    @ApiProperty({ required: true })
    @Max(90.0)
    @Min(-90.0)
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
