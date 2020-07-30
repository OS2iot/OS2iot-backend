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

import { IoTDeviceService } from "@services/iot-device.service";
import { ErrorCodes } from "@enum/error-codes.enum";

@ApiTags("Receive Data")
@Controller("receive-data")
export class ReceiveDataController {
    constructor(private iotDeviceService: IoTDeviceService) {}

    @Post()
    @Header("Cache-Control", "none")
    @ApiOperation({ summary: "Receive generic JSON data from edge devices" })
    @ApiBadRequestResponse()
    @HttpCode(204)
    async receive(
        @Query("apiKey") apiKey: string,
        @Body() data: string
    ): Promise<void> {
        const deviceExists = await this.iotDeviceService.isApiKeyValid(apiKey);

        if (!deviceExists) {
            const exception = new ForbiddenException(ErrorCodes.InvalidApiKey);
            Logger.error(
                "No device has been registered by the following API key " +
                    apiKey
            );
            throw exception;
        }
        return;
    }
}
