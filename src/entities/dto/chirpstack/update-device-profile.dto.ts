import { OmitType } from "@nestjs/swagger";
import { CreateDeviceProfileDto } from "./create-device-profile.dto";

export class UpdateDeviceProfileDto extends OmitType(CreateDeviceProfileDto, ["internalOrganizationId"]) {}
