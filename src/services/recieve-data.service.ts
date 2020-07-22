import { Injectable, Logger, HttpException, HttpStatus } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { RecieveData } from "@entities/recieve-data.entity";
import { Repository } from "typeorm";
import { CreateRecieveDataDto } from "@dto/create-recieve-data.dto";
import { IoTDeviceService } from "./iot-device.service";

@Injectable()
export class RecieveDataService {
    constructor(private iotDeviceService: IoTDeviceService) {}

    async create(apiKey: string, data: string): Promise<JSON> {
        try {
            const device = await this.iotDeviceService.findOneByApiKey(apiKey);

            try {
                JSON.parse(data);
            } catch (e) {
                throw new HttpException(
                    {
                        //return "406 Not Acceptable";
                        status: HttpStatus.FORBIDDEN,
                        error: "406 Not Acceptable",
                    },
                    HttpStatus.FORBIDDEN
                );
            }

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
                        status: HttpStatus.FORBIDDEN,
                        error: "204 No Content",
                    },
                    HttpStatus.FORBIDDEN
                );
            }
            return null;
        } catch (e) {
            throw e;
        }
    }
}
