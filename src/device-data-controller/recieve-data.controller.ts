import {
    Controller,
    Post,
    Header,
    Body,
    Query,
    HttpCode,
    ForbiddenException,
} from "@nestjs/common";

import { ApiTags, ApiOperation, ApiBadRequestResponse } from "@nestjs/swagger";

import { IoTDeviceService } from "@services/iot-device.service";

@ApiTags("Recieve Data")
@Controller("recieve-data")
export class RecieveDataController {
    constructor(private iotDeviceService: IoTDeviceService) {}

    @Post()
    @Header("Cache-Control", "none")
    @ApiOperation({ summary: "Create a new RecieveData" })
    @ApiBadRequestResponse()
    @HttpCode(204)
    async create(
        @Query("apiKey") apiKey: string,
        @Body() data: string
    ): Promise<void> {
        const deviceExists = await this.iotDeviceService.findAndValidateDeviceByApiKey(
            apiKey
        );

        if (!deviceExists) {
            throw new ForbiddenException();
        }
        return;
    }
}
