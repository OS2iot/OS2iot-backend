import { SigFoxDevice } from "@entities/sigfox-device.entity";
import { SigFoxApiDeviceContent } from "./sigfox/external/sigfox-api-device-response.dto";

export class SigFoxDeviceWithBackendDataDto extends SigFoxDevice {
    sigFoxSettings: SigFoxApiDeviceContent;
}
