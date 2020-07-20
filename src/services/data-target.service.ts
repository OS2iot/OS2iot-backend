import { Injectable } from "@nestjs/common";
import { Repository, getManager, DeleteResult } from "typeorm";
import { DataTarget } from "@entities/data-target.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { ListAllDataTargetsReponseDto } from "@dto/list-all-data-targets-response.dto";
import { CreateDataTargetDto } from "@dto/create-data-target.dto";
import { DataTargetType } from "@enum/data-target-type.enum";
import { dataTargetTypeMap } from "@enum/data-target-type-mapping";
import { ApplicationService } from "@services/application.service";
import { HttpPushDataTarget } from "@entities/http-push-data-target.entity";
import { UpdateDataTargetDto } from "@dto/update-data-target.dto";

@Injectable()
export class DataTargetService {
    constructor(
        @InjectRepository(DataTarget)
        private dataTargetRepository: Repository<DataTarget>,
        private applicationService: ApplicationService
    ) {}

    async findAll(): Promise<ListAllDataTargetsReponseDto> {
        // TODO: Pagination
        const [result, total] = await this.dataTargetRepository.findAndCount(
            {}
        );

        return {
            data: result,
            count: total,
        };
    }

    async create(
        createDataTargetDto: CreateDataTargetDto
    ): Promise<DataTarget> {
        const childType = dataTargetTypeMap[createDataTargetDto.type];
        const dataTarget = this.createDataTargetByDto(childType);

        const mappedDataTarget = await this.mapDtoToDataTarget(
            createDataTargetDto,
            dataTarget
        );

        // Use the generic manager since we cannot use a general repository.
        const entityManager = getManager();
        return await entityManager.save(mappedDataTarget);
    }

    async update(
        id: number,
        updateDataTargetDto: UpdateDataTargetDto
    ): Promise<DataTarget> {
        const existing = await this.dataTargetRepository.findOneOrFail(id);

        const mappedDataTarget = await this.mapDtoToDataTarget(
            updateDataTargetDto,
            existing
        );

        const res = this.dataTargetRepository.save(mappedDataTarget);

        return res;
    }

    async delete(id: number): Promise<DeleteResult> {
        return this.dataTargetRepository.delete(id);
    }

    private async mapDtoToDataTarget(
        dataTargetDto: CreateDataTargetDto,
        dataTarget: DataTarget
    ): Promise<DataTarget> {
        dataTarget.name = dataTargetDto.name;
        if (dataTargetDto.applicationId != null) {
            // TODO: What if it doesn't exist?
            dataTarget.application = await this.applicationService.findOneWithoutRelations(
                dataTargetDto.applicationId
            );
        }

        if (dataTargetDto.type === DataTargetType.HttpPush) {
            (dataTarget as HttpPushDataTarget).url = dataTargetDto.url;
            (dataTarget as HttpPushDataTarget).timeout = dataTargetDto.timeout;
            (dataTarget as HttpPushDataTarget).authorizationHeader =
                dataTargetDto.authorizationHeader;
        }

        return dataTarget;
    }

    private createDataTargetByDto<T extends DataTarget>(childDataTargetType: {
        new (): T;
    }): T {
        return new childDataTargetType();
    }
}
