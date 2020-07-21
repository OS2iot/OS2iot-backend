import {
    Controller,
    Post,
    Header,
    Body,
    Get,
    NotFoundException,
    Param,
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
        @Body() myData: JSON
    ): Promise<JSON> {
        // if (apiKey !== null) console.log(apiKey);

        try {
            var device = this.iotDeviceService.findOneByApiKey(apiKey);
            if ((await device).toString.length <= 0) console.log("apiKey");

            //console.log(data);
        } catch (e) {
            console.error(e);
        }

        return myData;
    }
}
