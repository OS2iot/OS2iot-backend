import { Injectable, Logger, HttpException, HttpStatus } from "@nestjs/common";
import { IoTDeviceService } from "./iot-device.service";

@Injectable()
export class RecieveDataService {
    constructor(private iotDeviceService: IoTDeviceService) {}

    async create(apiKey: string): Promise<void> {
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
