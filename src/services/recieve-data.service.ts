import { Injectable, Logger, HttpException, HttpStatus } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { RecieveData } from "@entities/recieve-data.entity";
import { Repository } from "typeorm";
import { IoTDeviceService } from "./iot-device.service";

@Injectable()
export class RecieveDataService {
    constructor(private iotDeviceService: IoTDeviceService) {}

    async create(apiKey: string, data: string): Promise<JSON> {
        try {
            const device = await this.iotDeviceService.findDeviceByApiKey(apiKey);

            if (!device) {
                const httpException =  new HttpException(
                    {   //Når device apiKey er forkert
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
           else if (device) {
                const httpException =  new HttpException(
                    {
                        //return "204 No Content";
                        status: HttpStatus.NO_CONTENT,
                        error: "204 No Content",
                        description:  "204 No Content",
                    },
                    HttpStatus.NO_CONTENT
                );
                Logger.log(httpException);
                throw httpException;
            }
            return null;
        } catch (e) {
            throw e;
        }
    }
}
