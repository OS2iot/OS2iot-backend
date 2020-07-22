import {
    Controller,
    Post,
    Header,
    Body,
    Get,
    NotFoundException,
    Param,
    HttpException,
    HttpStatus,
    Logger,
} from "@nestjs/common";
import * as http from "https";
import * as querystring from "querystring";
import { ApiTags, ApiOperation, ApiBadRequestResponse } from "@nestjs/swagger";
import { RecieveDataService } from "@services/recieve-data.service";
import { CreateRecieveDataDto } from "@dto/create-recieve-data.dto";
import { IoTDevice } from "@entities/iot-device.entity";
import { IoTDeviceService } from "@services/iot-device.service";
import { RecieveData } from "@entities/recieve-data.entity";
import { IoTDeviceController } from "@admin-controller/iot-device.controller";

@ApiTags("RecieveData")
@Controller("recieveData")
export class RecieveDataController {
    constructor(
        private iotDeviceService: IoTDeviceService,
        private recieveDataService: RecieveDataService
    ) {}

    @Post()
    @Header("Cache-Control", "none")
    @ApiOperation({ summary: "Create a new RecieveData" })
    @ApiBadRequestResponse()
    async create(
        @Param("apiKey") apiKey: string,
        @Body() jsonBody: string
    ): Promise<void> {
        try {
            const device = await this.iotDeviceService.findOneByApiKey(apiKey);
            Logger.log("------------ " + device + " ----------------");

            if (!device) {
                throw new HttpException(
                    {
                        //return "403 Forbidden";
                        status: HttpStatus.FORBIDDEN,
                        error: "403 Forbidden",
                    },
                    HttpStatus.FORBIDDEN
                );
            }
            //TODO: 204 No Content - når recievedData er videresendt
            if (device) {
                throw new HttpException(
                    {
                        //return "204 No Content";
                        status: HttpStatus.NO_CONTENT,
                        error: "204 No Content",
                    },
                    HttpStatus.FORBIDDEN
                );
            }
        } catch (e) {
            throw e;
        }
    }
}
