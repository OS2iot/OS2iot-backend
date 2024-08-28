import { SigFoxDevice } from "@entities/sigfox-device.entity";
import { CreateSigFoxSettingsDto } from "./create-sigfox-settings.dto";

export class SigFoxDeviceWithBackendDataDto extends SigFoxDevice {
  sigfoxSettings: CreateSigFoxSettingsDto;
}
