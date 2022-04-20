import { IsString } from "class-validator";

export class TestPayloadDecoderDto {
    @IsString()
    code: string;
    @IsString()
    iotDeviceJsonString: string;
    @IsString()
    rawPayloadJsonString: string;
}
