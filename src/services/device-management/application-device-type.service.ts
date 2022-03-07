import { ApplicationDeviceType } from "@entities/application-device-type.entity";
import { ApplicationDeviceTypeUnion } from "@enum/device-type.enum";
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { FindOneOptions, In, Repository } from "typeorm";

@Injectable()
export class ApplicationDeviceTypeService {
    constructor(
        @InjectRepository(ApplicationDeviceType)
        private applicationDeviceTypeRepository: Repository<ApplicationDeviceType>
    ) {}

    findByTypes(types: ApplicationDeviceTypeUnion[]): Promise<ApplicationDeviceType[]> {
        return this.applicationDeviceTypeRepository.find({ where: { type: In(types) } });
    }

    findOne(
        id?: number,
        options?: FindOneOptions<ApplicationDeviceType>
    ): Promise<ApplicationDeviceType> {
        return this.applicationDeviceTypeRepository.findOne(id, options);
    }
}
