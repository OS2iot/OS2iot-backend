import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { RecieveData } from "@entities/recieve-data.entity";
import { Repository } from "typeorm";
import { CreateRecieveDataDto } from "@dto/create-recieve-data.dto";

@Injectable()
export class RecieveDataService {
    constructor(
        @InjectRepository(RecieveData)
        private recieveDataRepository: Repository<RecieveData>
    ) {}

    async create(
    ): Promise<RecieveData> {
        const recieveData = new RecieveData();
            //TODO: inser Logger returning Enum;
        Logger.warn(recieveData.toString)
        return recieveData;//this.recieveDataRepository.save(recieveData);
    }
}


