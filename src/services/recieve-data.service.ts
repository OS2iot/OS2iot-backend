import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { RecieveData } from "@entities/recieve-data.entity";
import { Repository } from "typeorm";
import { CreateRecieveDataDto } from "@dto/create-recieve-data.dto";

@Injectable()
export class RecieveDataService {
    constructor() //  @InjectRepository(RecieveData)
    // private recieveDataRepository: Repository<RecieveData>

    {}

    /*
    async create(
        createRecieveDataDto: CreateRecieveDataDto
    ): Promise<RecieveData> {
        const recieveData = new RecieveData();
      
        return this.recieveDataRepository.save(recieveData);
    }
    */
}
