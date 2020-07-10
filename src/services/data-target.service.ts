import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataTarget } from "@entities/data-target.entity";
import { Repository, DeleteResult } from "typeorm";
import { CreateDataTargetDto } from "@dto/create-data-target.dto";
import { UpdateDataTargetDto } from "@dto/update-data-target.dto";

@Injectable()
export class DataTargetService {
    constructor(
        @InjectRepository(DataTarget)
        private dataTargetRepository: Repository<DataTarget>
    ) {}

    async findOne(id: string): Promise<DataTarget> {
        return await this.dataTargetRepository.findOneOrFail(id, {
            relations: ["application"],
        });
    }
    
    async create(
        createDataTargetDto: CreateDataTargetDto
    ): Promise<DataTarget> {
        const dataTarget = new DataTarget();

        const mappedDataTarget = this.mapDataTargetDtoToDataTarget(
            createDataTargetDto,
            dataTarget
        );

        return this.dataTargetRepository.save(mappedDataTarget);
    }

    async update(
        id: string,
        updateDataTargetDto: UpdateDataTargetDto
    ): Promise<DataTarget> {
        const existingDataTarget = await this.dataTargetRepository.findOneOrFail(
            id
        );

        const mappedDataTarget = this.mapDataTargetDtoToDataTarget(
            updateDataTargetDto,
            existingDataTarget
        );

        return this.dataTargetRepository.save(mappedDataTarget);
    }

    async delete(id: string): Promise<DeleteResult> {
        return this.dataTargetRepository.delete(id);
    }

    private mapDataTargetDtoToDataTarget


    (
        dataTargetDto: CreateDataTargetDto | UpdateDataTargetDto,
        dataTarget: DataTarget
    ): DataTarget {
        dataTarget.targetName = dataTargetDto.targetName;
        dataTarget.applicationId = dataTargetDto.applicationId;
        dataTarget.devices = dataTargetDto.devices;



        return dataTarget;
    }
}
