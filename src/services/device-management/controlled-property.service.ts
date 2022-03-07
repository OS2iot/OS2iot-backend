import { ControlledProperty } from "@entities/controlled-property.entity";
import { ControlledPropertyTypes } from "@enum/controlled-property.enum";
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { FindOneOptions, In, Repository } from "typeorm";

@Injectable()
export class ControlledPropertyService {
    constructor(
        @InjectRepository(ControlledProperty)
        private controlledPropertyRepository: Repository<ControlledProperty>
    ) {}

    createNew(type: ControlledPropertyTypes, userId: number | null): Promise<ControlledProperty> {
        const entity = new ControlledProperty();
        entity.type = type;
        entity.createdBy = userId;
        entity.updatedBy = userId;

        return this.controlledPropertyRepository.save(entity);
    }

    findByTypes(types: ControlledPropertyTypes[]): Promise<ControlledProperty[]> {
        return this.controlledPropertyRepository.find({ where: { type: In(types) } });
    }

    findOne(
        id?: number,
        options?: FindOneOptions<ControlledProperty>
    ): Promise<ControlledProperty> {
        return this.controlledPropertyRepository.findOne();
    }
}
