import { ApiProperty } from "@nestjs/swagger";
import { IsNumber } from "class-validator";

export class CreateIoTDevicePayloadDecoderDataTargetConnectionDto {
    @ApiProperty({ required: true })
    @IsNumber()
    iotDeviceId: number;

    @ApiProperty({ required: false })
    @IsNumber()
    payloadDecoderId?: number;

    @ApiProperty({ required: true })
    @IsNumber()
    dataTargetId: number;
}
