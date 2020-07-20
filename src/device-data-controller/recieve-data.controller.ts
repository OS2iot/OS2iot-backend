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
    iotDeviceService: IoTDeviceService;
    constructor(private recieveDataService: RecieveDataService) {}

    //TODO - Check if API key is valid - does it exist in the db

    //TODO - Check if API key is valid - does it exist in the db
    //TODO - Find the application the device belongs too
    //TODO - Find datatarget for the application
    //TODO - find the meta data for the dataTarget
    //TODO - store last datapoint in DB
    //TODO - Definer succes/fail besked

    @Post()
    @Header("Cache-Control", "none")
    @ApiOperation({ summary: "Create a new RecieveData" })
    @ApiBadRequestResponse()
    async create(
        @Param("apiKey") apiKey: string,
        @Body() createRecieveDataDto: CreateRecieveDataDto
    ): Promise<RecieveData> {
        // if (apiKey !== null) console.log(apiKey);
        var data;
        var exists = await this.iotDeviceService.findOneByApiKey(apiKey);
        if (exists === null) {
            console.log(apiKey);
            console.log(data);
        } else {
            data = this.recieveDataService.create(createRecieveDataDto);
            console.log(data);
        }

        return data;
    }
}
