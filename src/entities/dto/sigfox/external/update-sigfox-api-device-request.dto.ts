import { OmitType } from "@nestjs/swagger";
import { CreateSigFoxApiDeviceRequestDto } from "./create-sigfox-api-device-request.dto";

export class UpdateSigFoxApiDeviceRequestDto extends OmitType(CreateSigFoxApiDeviceRequestDto, [
    "id",
    "pac",
    "deviceTypeId",
]) {}
