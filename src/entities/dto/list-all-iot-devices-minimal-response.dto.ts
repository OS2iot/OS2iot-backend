import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional } from "class-validator";

export class ListAllIoTDevicesMinimalResponseDto {
    @ApiProperty()
    data: IoTDeviceMinimal[];
    @ApiProperty()
    count: number;
}

export class IoTDeviceMinimal {
    id: number;

    name: string;

    canRead: boolean;

    applicationId: number;

    organizationId: number;

    lastActiveTime: Date;
}

export class IoTDeviceMinimalRaw {
    id: number;

    name: string;

    applicationId: number;

    organizationId: number;

    sentTime: Date;
}

export class PayloadDecoderIoDeviceMinimalQuery {
    @ApiPropertyOptional()
    @IsOptional()
    limit? = 20;

    @ApiPropertyOptional()
    @IsOptional()
    offset? = 0;
}
