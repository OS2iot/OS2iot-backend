import { IoTDevice } from "@entities/iot-device.entity";
import { Injectable, Logger } from "@nestjs/common";
import { VM, VMScript } from "vm2";

@Injectable()
export class PayloadDecoderExecutorService {
    private readonly logger = new Logger(PayloadDecoderExecutorService.name);

    allUntrustedCodeWithJsonStrings(
        code: string,
        iotDeviceString: string,
        rawPayloadString: string
    ): string {
        const iotDevice = JSON.parse(iotDeviceString);
        const rawPayload = JSON.parse(rawPayloadString);
        const parsedCode = JSON.parse(code);

        return this.callUntrustedCode(parsedCode, iotDevice, rawPayload);
    }

    callUntrustedCode(
        code: string,
        iotDevice: IoTDevice | any,
        rawPayload: JSON
    ): string {
        const vm2Logger = new Logger(`${PayloadDecoderExecutorService.name}-VM2`);
        
        // Make copies of inputs to untrusted code to avoid unintended side effects if the code chooses to modify these
        const iotDeviceCopy = JSON.parse(JSON.stringify(iotDevice));
        const payloadCopy = JSON.parse(JSON.stringify(rawPayload));
        
        const vm = new VM({
            timeout: 5000,
            sandbox: {
                innerIotDevice: iotDeviceCopy,
                innerPayload: payloadCopy,
                log(data: any): void {
                    vm2Logger.debug(data);
                },
                btoa(str: string): string {
                    return Buffer.from(str).toString("base64");
                },
                atob(str: string): string {
                    return Buffer.from(str, "base64").toString("binary");
                },
            },
        });
        const callingCode = `\n\ndecode(innerPayload, innerIotDevice);`;
        const combinedCode = code + callingCode;
        const res = vm.run(new VMScript(combinedCode));
        this.logger.debug(`Returned: '${JSON.stringify(res)}'`);

        return JSON.stringify(res);
    }
}
