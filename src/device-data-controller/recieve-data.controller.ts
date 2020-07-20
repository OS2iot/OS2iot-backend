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
import {
    ApiTags,
    ApiOperation,
    ApiBadRequestResponse,
    ApiNotFoundResponse,
} from "@nestjs/swagger";
import { RecieveDataService } from "@services/recieve-data.service";
import { CreateRecieveDataDto } from "@dto/create-recieve-data.dto";
import { IoTDevice } from "@entities/iot-device.entity";
import { IoTDeviceService } from "@services/iot-device.service";

@ApiTags("RecieveData")
@Controller("recieveData")
export class RecieveDataController {
    iotDeviceService: IoTDeviceService;
    constructor(private recieveDataService: RecieveDataService) {}

    //TODO - Check if API key is valid - does it exist in the db

    @Get(":id")
    @ApiOperation({ summary: "Find one IoT-Device by apiKey" })
    @ApiNotFoundResponse()
    async findOne(@Param("apiKey") id: number): Promise<IoTDevice> {
        try {
            return await this.iotDeviceService.findOne(id);
        } catch (err) {
            throw new NotFoundException(`No element found by apiKey: ${id}`);
        }
    }
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
        @Body() createRecieveDataDto: CreateRecieveDataDto
        // createHttpPushTargetDto: CreateHttpPushTargetDto
    ): Promise<Object> {
        if (createRecieveDataDto.apiKey === null) {
            return;
        }

        const postData = JSON.stringify({
            data: createRecieveDataDto.data,
        });

        const options = {
            //TODO fix address to take argument / get data from DB assosiated with application data  target
            hostname: "www.google.dk", //"createHttpPushTargetDto.targetUrl",
            port: 8050,
            path: "createHttpPushTargetDto.targetPath",
            method: "POST",
            timeout: 5000, // Set timeout based on dataTarget
            headers: {
                "Content-Type": "application/json",
                "Content-Length": Buffer.byteLength(postData),
                Authorization: "createRecieveDataDto.apiKey",
            },
        };

        const req = http.request(options, res => {
            console.log("ApiKey " + createRecieveDataDto.apiKey);
            console.log("Data " + createRecieveDataDto.data);
            console.log(`STATUS: ${res.statusCode}`);
            console.log(`HEADERS: ${JSON.stringify(res.headers)}`);

            res.setEncoding("utf8");
            res.on("data", chunk => {
                console.log(`BODY: ${chunk}`);
            });
            res.on("end", () => {
                console.log("No more data in response.");
            });
        });

        req.on("error", e => {
            console.error(`problem with request: ${e.message}`);
        });

        // Write data to request body
        req.write(postData);
        req.end();
        console.log("SEND DATA " + postData);

        return postData;
    }
}
