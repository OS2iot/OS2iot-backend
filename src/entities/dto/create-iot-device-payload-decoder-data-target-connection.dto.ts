import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsOptional } from "class-validator";

export class CreateIoTDevicePayloadDecoderDataTargetConnectionDto {
    @ApiProperty({ required: true })
    @IsNumber()
    iotDeviceId: number;

    @ApiProperty({ required: false })
    @IsOptional()
    payloadDecoderId?: number;

    @ApiProperty({ required: true })
    @IsNumber()
    dataTargetId: number;
}
