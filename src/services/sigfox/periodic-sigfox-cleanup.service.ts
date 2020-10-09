import {
    SigFoxApiDeviceContent,
    SigFoxApiDeviceResponse,
} from "@dto/sigfox/external/sigfox-api-device-response.dto";
import { SigFoxDevice } from "@entities/sigfox-device.entity";
import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { IoTDeviceService } from "@services/device-management/iot-device.service";
import * as _ from "lodash";
import { SigFoxApiDeviceService } from "./sigfox-api-device.service";
import { SigFoxGroupService } from "./sigfox-group.service";

@Injectable()
export class PeriodicSigFoxCleanupService {
    constructor(
        private iotDevicService: IoTDeviceService,
        private sigfoxApiDeviceService: SigFoxApiDeviceService,
        private sigfoxGroupService: SigFoxGroupService
    ) {}
    private readonly logger = new Logger(PeriodicSigFoxCleanupService.name);

    @Cron(CronExpression.EVERY_5_MINUTES)
    async cleanupDevicesRemovedFromSigFoxBackend(): Promise<void> {
        // get all sigfox devices in database
        const sigFoxDevicesInDatabasePromise = this.iotDevicService.findAllSigFoxDevices();
        // get all sigfox groups
        const flattenedSigFoxDevices = await this.getDevicesInSigFoxBackend();
        const sigFoxDevicesInDb = await sigFoxDevicesInDatabasePromise;
        // Find all devices ONLY in database and not in sigfox backend
        const devicesToRemove = _.differenceBy(
            sigFoxDevicesInDb,
            flattenedSigFoxDevices,
            x => {
                return this.getId(x);
            }
        );
        if (devicesToRemove.length > 0) {
            // Delete them
            const idsToDelete = devicesToRemove.map(x => x.id);
            this.logger.log(`Will remove devices: ${idsToDelete.join(", ")}`);
            await this.iotDevicService.deleteMany(idsToDelete);
        }
    }

    private async getDevicesInSigFoxBackend() {
        const sigFoxGroups = await this.sigfoxGroupService.findAll();
        const uniqueSigFoxGroups = _.uniqBy(sigFoxGroups, x => x.username);
        // get all sigfox devices in sigfox backend
        const sigFoxDevicesInBackend = await Promise.all(
            uniqueSigFoxGroups.map(
                async x => (await this.sigfoxApiDeviceService.getAllByGroupIds(x)).data
            )
        );
        const flattenedSigFoxDevices = _.flatten(sigFoxDevicesInBackend);
        return flattenedSigFoxDevices;
    }

    private getId(device: SigFoxDevice | SigFoxApiDeviceContent) {
        if (this.isSigFoxDevice(device)) {
            return device.deviceId;
        }
        return device.id;
    }

    private isSigFoxDevice(obj: any): obj is SigFoxDevice {
        return obj.deviceId !== undefined;
    }
}
