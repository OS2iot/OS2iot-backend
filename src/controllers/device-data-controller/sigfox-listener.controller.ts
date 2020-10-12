import {
    Body,
    Controller,
    Logger,
    NotFoundException,
    Post,
    Query,
    BadRequestException,
    Res,
} from "@nestjs/common";
import {
    ApiBadRequestResponse,
    ApiNoContentResponse,
    ApiOkResponse,
    ApiOperation,
    ApiTags,
} from "@nestjs/swagger";

import { SigFoxCallbackDto } from "@dto/sigfox/sigfox-callback.dto";
import { IoTDeviceType } from "@enum/device-type.enum";
import { ReceiveDataService } from "@services/data-management/receive-data.service";
import { IoTDeviceService } from "@services/device-management/iot-device.service";
import { SigFoxDevice } from "@entities/sigfox-device.entity";
import { SigFoxDownlinkCallbackDto } from "@dto/sigfox/external/sigfox-callback.dto";
import { HttpStatus } from "@nestjs/common/enums/http-status.enum";
import { Request, Response } from "express";

@ApiTags("SigFox")
@Controller("sigfox-callback")
export class SigFoxListenerController {
    constructor(
        private receiveDataService: ReceiveDataService,
        private iotDeviceService: IoTDeviceService
    ) {}

    private readonly logger = new Logger(SigFoxListenerController.name);

    @Post("data/uplink")
    @ApiOperation({ summary: "SigFox data callback endpoint." })
    @ApiOkResponse()
    @ApiNoContentResponse()
    @ApiBadRequestResponse()
    async sigfoxCallback(
        @Query("apiKey") apiKey: string,
        @Body() data: SigFoxCallbackDto,
        @Res() res: Response
    ): Promise<any> {
        this.verifyDeviceType(apiKey, data);

        const sigfoxDevice = await this.findSigFoxDevice(data);

        const dataAsString = JSON.stringify(data);
        await this.receiveDataService.sendToKafka(
            sigfoxDevice,
            dataAsString,
            IoTDeviceType.SigFox.toString(),
            data.time
        );

        if (this.shouldSendDownlink(sigfoxDevice)) {
            const payload = await this.doDownlink(sigfoxDevice);
            return res.status(200).send(JSON.stringify(payload));
        }

        return res.status(204).send();
    }

    private async doDownlink(
        sigfoxDevice: SigFoxDevice
    ): Promise<SigFoxDownlinkCallbackDto> {
        this.logger.log(
            `Time to downlink for device(${sigfoxDevice.id}) sigfoxId(${sigfoxDevice.deviceId})`
        );

        const dto: SigFoxDownlinkCallbackDto = {};
        dto[sigfoxDevice.deviceId] = {
            downlinkData: sigfoxDevice.downlinkPayload,
        };

        await this.iotDeviceService.removeDownlink(sigfoxDevice);

        return dto;
    }

    private verifyDeviceType(apiKey: string, data: SigFoxCallbackDto) {
        if (apiKey != data?.deviceTypeId) {
            this.logger.error(
                `ApiKey(${apiKey}) did not match DeviceTypeId(${data?.deviceTypeId})`
            );
            throw new BadRequestException();
        }
    }

    private shouldSendDownlink(iotDevice: SigFoxDevice) {
        return iotDevice.downlinkPayload != null;
    }

    private async findSigFoxDevice(data: SigFoxCallbackDto) {
        const iotDevice = await this.iotDeviceService.findSigFoxDeviceByDeviceIdAndDeviceTypeId(
            data.deviceId,
            data.deviceTypeId
        );

        if (!iotDevice) {
            this.logger.error(
                `Could not find SigFox device with id: '${data.deviceId}' and deviceType id: '${data.deviceTypeId}'`
            );
            throw new NotFoundException();
        }
        return iotDevice;
    }
}
