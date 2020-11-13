import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import {
    DeleteResult,
    Repository,
    SelectQueryBuilder,
    getConnection,
    getManager,
} from "typeorm";

import { CreateDataTargetDto } from "@dto/create-data-target.dto";
import { ListAllDataTargetsResponseDto } from "@dto/list-all-data-targets-response.dto";
import { ListAllDataTargetsDto } from "@dto/list-all-data-targets.dto";
import { UpdateDataTargetDto } from "@dto/update-data-target.dto";
import { DataTarget } from "@entities/data-target.entity";
import { HttpPushDataTarget } from "@entities/http-push-data-target.entity";
import { dataTargetTypeMap } from "@enum/data-target-type-mapping";
import { DataTargetType } from "@enum/data-target-type.enum";
import { ErrorCodes } from "@enum/error-codes.enum";
import { ApplicationService } from "@services/device-management/application.service";
import { OpenDataDkDataset } from "@entities/open-data-dk-dataset.entity";

@Injectable()
export class DataTargetService {
    constructor(
        @InjectRepository(DataTarget)
        private dataTargetRepository: Repository<DataTarget>,
        @InjectRepository(OpenDataDkDataset)
        private openDataDkRepository: Repository<OpenDataDkDataset>,
        private applicationService: ApplicationService
    ) {}

    async findAndCountAllWithPagination(
        query?: ListAllDataTargetsDto,
        applicationIds?: number[]
    ): Promise<ListAllDataTargetsResponseDto> {
        let queryBuilder = getConnection()
            .getRepository(DataTarget)
            .createQueryBuilder("datatarget")
            .innerJoinAndSelect("datatarget.application", "application")
            .limit(query.limit)
            .offset(query.offset)
            .orderBy(query.orderOn, "ASC");

        // Only apply applicationId filter, if one is given.
        queryBuilder = this.filterByApplication(query, queryBuilder, applicationIds);

        const [result, total] = await queryBuilder.getManyAndCount();

        return {
            data: result,
            count: total,
        };
    }

    private filterByApplication(
        query: ListAllDataTargetsDto,
        queryBuilder: SelectQueryBuilder<DataTarget>,
        applicationIds: number[]
    ) {
        if (query.applicationId) {
            queryBuilder = queryBuilder.where("datatarget.application = :appId", {
                appId: query.applicationId,
            });
        } else if (applicationIds) {
            queryBuilder = queryBuilder.where(
                '"application"."id" IN (:...allowedApplications)',
                {
                    allowedApplications: applicationIds,
                }
            );
        }
        return queryBuilder;
    }

    async findOne(id: number): Promise<DataTarget> {
        return await this.dataTargetRepository.findOneOrFail(id, {
            relations: ["application", "openDataDkDataset"],
        });
    }

    async findDataTargetsByApplicationId(applicationId: number): Promise<DataTarget[]> {
        return await this.dataTargetRepository.find({
            application: { id: applicationId },
        });
    }

    async create(createDataTargetDto: CreateDataTargetDto): Promise<DataTarget> {
        const childType = dataTargetTypeMap[createDataTargetDto.type];
        const dataTarget = this.createDataTargetByDto(childType);

        const mappedDataTarget = await this.mapDtoToDataTarget(
            createDataTargetDto,
            dataTarget
        );

        if (createDataTargetDto.openDataDkDataset) {
            dataTarget.openDataDkDataset = this.mapOpenDataDk(createDataTargetDto);
        }

        // Use the generic manager since we cannot use a general repository.
        const entityManager = getManager();
        return await entityManager.save(mappedDataTarget, {});
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
            try {
                dataTarget.application = await this.applicationService.findOneWithoutRelations(
                    dataTargetDto.applicationId
                );
            } catch (err) {
                Logger.error(
                    `Could not find application with id: ${dataTargetDto.applicationId}`
                );

                throw new BadRequestException(ErrorCodes.IdDoesNotExists);
            }
        } else {
            throw new BadRequestException(ErrorCodes.IdMissing);
        }

        this.setAuthorizationHeader(dataTargetDto, dataTarget);

        return dataTarget;
    }

    private mapOpenDataDk(createDataTargetDto: CreateDataTargetDto): OpenDataDkDataset {
        const openDataDkDataset = this.openDataDkRepository.create(
            createDataTargetDto.openDataDkDataset
        );
        Logger.debug(JSON.stringify(createDataTargetDto.openDataDkDataset));

        return openDataDkDataset;
    }

    private setAuthorizationHeader(
        dataTargetDto: CreateDataTargetDto,
        dataTarget: DataTarget
    ) {
        if (dataTargetDto.type === DataTargetType.HttpPush) {
            (dataTarget as HttpPushDataTarget).url = dataTargetDto.url;
            (dataTarget as HttpPushDataTarget).timeout = dataTargetDto.timeout;
            (dataTarget as HttpPushDataTarget).authorizationHeader =
                dataTargetDto.authorizationHeader;
        }
    }

    private createDataTargetByDto<T extends DataTarget>(childDataTargetType: {
        new (): T;
    }): T {
        return new childDataTargetType();
    }
}
