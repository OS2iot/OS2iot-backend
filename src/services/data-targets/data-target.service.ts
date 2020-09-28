import { Injectable, BadRequestException, Logger } from "@nestjs/common";
import {
    Repository,
    getManager,
    DeleteResult,
    getConnection,
    SelectQueryBuilder,
} from "typeorm";
import { DataTarget } from "@entities/data-target.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { ListAllDataTargetsReponseDto } from "@dto/list-all-data-targets-response.dto";
import { CreateDataTargetDto } from "@dto/create-data-target.dto";
import { DataTargetType } from "@enum/data-target-type.enum";
import { dataTargetTypeMap } from "@enum/data-target-type-mapping";
import { ApplicationService } from "@services/device-management/application.service";
import { HttpPushDataTarget } from "@entities/http-push-data-target.entity";
import { UpdateDataTargetDto } from "@dto/update-data-target.dto";
import { ErrorCodes } from "@enum/error-codes.enum";
import { ListAllDataTargetsDto } from "@dto/list-all-data-targets.dto";

@Injectable()
export class DataTargetService {
    constructor(
        @InjectRepository(DataTarget)
        private dataTargetRepository: Repository<DataTarget>,
        private applicationService: ApplicationService
    ) {}

    async findAndCountAllWithPagination(
        query?: ListAllDataTargetsDto,
        applicationIds?: number[]
    ): Promise<ListAllDataTargetsReponseDto> {
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
            relations: ["application"],
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
