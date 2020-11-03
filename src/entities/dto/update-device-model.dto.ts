import { PickType } from "@nestjs/swagger";
import { CreateDeviceModelDto } from "./create-device-model.dto";

export class UpdateDeviceModelDto extends PickType(CreateDeviceModelDto, ["body"]) {}
