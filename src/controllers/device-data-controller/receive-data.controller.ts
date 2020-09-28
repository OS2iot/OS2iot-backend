import {
    Controller,
    Post,
    Header,
    Body,
    Query,
    HttpCode,
    ForbiddenException,
    Logger,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBadRequestResponse } from "@nestjs/swagger";
import { IoTDeviceService } from "@services/device-management/iot-device.service";
import { ErrorCodes } from "@enum/error-codes.enum";
import { ReceiveDataService } from "@services/data-management/receive-data.service";
import { ReceiveDataDto } from "@dto/receive-data.dto";
import { IoTDeviceType } from "@enum/device-type.enum";

@ApiTags("Receive Data")
@Controller("receive-data")
export class ReceiveDataController {
    constructor(
        private iotDeviceService: IoTDeviceService,
        private receiveDataService: ReceiveDataService
    ) {}

    @Post()
    @Header("Cache-Control", "none")
    @ApiOperation({ summary: "Receive generic JSON data from edge devices" })
    @ApiBadRequestResponse()
    @HttpCode(204)
    async receive(
        @Query("apiKey") apiKey: string,
        @Body() data: ReceiveDataDto
    ): Promise<void> {
        const iotDevice = await this.checkIfDeviceIsValid(apiKey);

        // @HACK: Convert the 'data' back to a string.
        // NestJS / BodyParser always converts the input to an object for us.
        const dataAsString = JSON.stringify(data);
        await this.receiveDataService.sendToKafka(
            iotDevice,
            dataAsString,
            IoTDeviceType.GenericHttp.toString()
        );

        return;
    }

    private async checkIfDeviceIsValid(apiKey: string) {
        const iotDevice = await this.iotDeviceService.findGenericHttpDeviceByApiKey(
            apiKey
        );

        if (!iotDevice) {
            const exception = new ForbiddenException(ErrorCodes.InvalidApiKey);
            Logger.error(
                "No device has been registered by the following API key " + apiKey
            );
            throw exception;
        }
        return iotDevice;
    }
}
