import {
    Controller,
    Post,
    Header,
    Body,
    Param,
    HttpException,
    HttpStatus,
    Logger,
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
    async create(
        @Param("apiKey") apiKey: string,
        @Body() data: string
    ): Promise<void> {
        try {
            const deviceExists = await this.iotDeviceService.findAndValidateDeviceByApiKey(
                apiKey
            );

            if (deviceExists) {
                const httpException = new HttpException(
                    {
                        //TODO: 204 No Content - når recievedData er videresendt
                        //return "204 No Content";
                        status: HttpStatus.NO_CONTENT,
                        error: "204 No Content",
                        description: "204 No Content",
                    },
                    HttpStatus.NO_CONTENT
                );
                Logger.log(httpException);
                throw httpException;
            }

            if (!deviceExists) {
                const httpException = new HttpException(
                    {
                        //Når device apiKey er forkert
                        //return "403 Forbidden";
                        status: HttpStatus.FORBIDDEN,
                        error: "403 Forbidden",
                        description: "403 Forbidden",
                    },
                    HttpStatus.FORBIDDEN
                );
                Logger.log(httpException);
                throw httpException;
            }
        } catch (e) {
            throw e;
        }
    }
}
