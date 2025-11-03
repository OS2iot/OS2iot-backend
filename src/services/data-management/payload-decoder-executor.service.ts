import { AuthenticatedRequest } from "@dto/internal/authenticated-request";
import { IoTDevice } from "@entities/iot-device.entity";
import { ApplicationAccessScope, checkIfUserHasAccessToApplication } from "@helpers/security-helper";
import { Injectable, Logger } from "@nestjs/common";
import * as worker_threads from "node:worker_threads";

@Injectable()
export class PayloadDecoderExecutorService {
  private readonly logger = new Logger(PayloadDecoderExecutorService.name);

  async allUntrustedCodeWithJsonStrings(
    code: string,
    iotDeviceString: string,
    rawPayloadString: string
  ): Promise<string> {
    const iotDevice = JSON.parse(iotDeviceString);
    const rawPayload = JSON.parse(rawPayloadString);
    const parsedCode = JSON.parse(code);

    return await this.callUntrustedCode(parsedCode, iotDevice, rawPayload);
  }

  async callUntrustedCode(code: string, iotDevice: IoTDevice | any, rawPayload: JSON): Promise<string> {
    // Left as check of surrounding code for worker function
    // const workerFunction = () => {
    //     const { parentPort, workerData } = require("worker_threads");
    //     const innerPayload = workerData.innerPayload;
    //     const innerIotDevice = workerData.innerIotDevice;
    //
    //     code;
    //
    //     const result = decode(innerPayload, innerIotDevice);
    //     parentPort.postMessage(result);
    // };

    const workerCode = `
        const { parentPort, workerData } = require("worker_threads");
        const innerPayload = workerData.innerPayload;
        const innerIotDevice = workerData.innerIotDevice;

        ${code}

        const result = decode(innerPayload, innerIotDevice);
        parentPort.postMessage(result);`;

    const workerFunction = new Promise((resolve, reject) => {
      const worker = new worker_threads.Worker(workerCode, {
        eval: true,
        workerData: { innerPayload: rawPayload, innerIotDevice: iotDevice },
      });

      worker.on("message", message => {
        resolve(message);
        worker.terminate();
      });

      worker.on("error", err => {
        reject(err);
        worker.terminate();
      });
    });

    return JSON.stringify(await workerFunction);
  }
}
