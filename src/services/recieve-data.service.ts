import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { RecieveData } from "@entities/recieve-data.entity";
import { Repository } from "typeorm";
import { CreateRecieveDataDto } from "@dto/create-recieve-data.dto";
import { IoTDeviceService } from "./iot-device.service";

@Injectable()
export class RecieveDataService {
    constructor(
        private iotDeviceService: IoTDeviceService,

        @InjectRepository(RecieveData)
        private recieveDataRepository: Repository<RecieveData>
    ) {}

    async create(apiKey: string, data: string): Promise<string> {
        try {
            const device = await this.iotDeviceService.findOneByApiKey(apiKey);

            try {
                JSON.parse(data);
            } catch (e) {
                return "406 Not Acceptable";
            }

            if (!device) return "403 Forbidden";
            //TODO: 204 No Content - når recievedData er videresendt
            if (device) return " 204 No Content";
        } catch (e) {
            throw e;
        }
    }
}
