import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataTarget } from "@entities/data-target.entity";
import { Repository, DeleteResult } from "typeorm";
import { CreateDataTargetDto } from "@dto/create/create-data-target.dto";
import { UpdateDataTargetDto } from "@dto/update/update-data-target.dto";
import {ListAllDataTargetsDto} from "@dto/list/list-all-data-targets.dto"
import {ListAllDataTargetReponseDto} from "@dto/list/list-all-data-targets-response.dto"

@Injectable()
export class DataTargetService {
    constructor(
        @InjectRepository(DataTarget)
        private dataTargetRepository: Repository<DataTarget>
    ) {}

    async findOneWithoutRelations(id: number): Promise<DataTarget> {
        return await this.dataTargetRepository.findOneOrFail(id);
    }

    async findOne(id: number): Promise<DataTarget> {
        return await this.dataTargetRepository.findOneOrFail(id, {
        });
    }
    async findAndCountWithPagination(
        query?: ListAllDataTargetsDto
    ): Promise<ListAllDataTargetReponseDto> {
        const [result, total] = await this.dataTargetRepository.findAndCount({
            where: {},
            take: query.limit,
            skip: query.offset,
            
        });

        return {
            data: result,
            count: total,
        };
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
        dataTarget.TargetId = dataTargetDto.TargetId;

        if (
            dataTarget.httpPushTarget === undefined ||
            dataTarget.httpPushTarget === null
        ) {
            //TODO Set httpPushTarget list here
            dataTarget.httpPushTarget = [];
        }

        return dataTarget;
    }
}
