import { ListAllApplicationsResponseDto } from "@dto/list-all-applications-response.dto";
import { ListAllMulticastsResponseDto } from "@dto/list-all-multicasts-response.dto";
import { ListAllMulticastsDto } from "@dto/list-all-multicasts.dto";
import { Multicast } from "@entities/multicast.entity";
import { ErrorCodes } from "@enum/error-codes.enum";
import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DeleteResult, getConnection, Repository, SelectQueryBuilder } from "typeorm";
import { CreateMulticastDto } from "../../entities/dto/create-multicast.dto";
import { UpdateMulticastDto } from "../../entities/dto/update-multicast.dto";
import { ApplicationService } from "./application.service";

@Injectable()
export class MulticastService {
    constructor(
        @InjectRepository(Multicast)
        private multicastRepository: Repository<Multicast>,
        private applicationService: ApplicationService
    ) {}
    private readonly logger = new Logger(MulticastService.name);

    async findAndCountAllWithPagination(
        query?: ListAllMulticastsDto,
        applicationIds?: number[]
    ): Promise<ListAllMulticastsResponseDto> {
        let queryBuilder = getConnection()
            .getRepository(Multicast)
            .createQueryBuilder("multicast")
            .innerJoinAndSelect("multicast.application", "application")
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
        query: ListAllMulticastsDto,
        queryBuilder: SelectQueryBuilder<Multicast>,
        applicationIds: number[]
    ) {
        if (query.applicationId) {
            queryBuilder = queryBuilder.where("multicast.application = :appId", {
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

    async findOne(id: number): Promise<Multicast> {
        return await this.multicastRepository.findOneOrFail(id, {
            relations: ["application"],
            loadRelationIds: {
                relations: ["createdBy", "updatedBy"],
            },
        });
    }

    async create(
        createMulticastDto: CreateMulticastDto,
        userId: number
    ): Promise<Multicast> {
        const multicast = new Multicast();

        const mappedMulticast = await this.mapMulticastDtoToMulticast(
            createMulticastDto,
            multicast
        );
        mappedMulticast.iotDevices = [];
        mappedMulticast.createdBy = userId;
        mappedMulticast.updatedBy = userId;

        const savedMulticast = await this.multicastRepository.save(mappedMulticast);

        return savedMulticast;
    }

    async update(
        id: number,
        updateMulticastDto: UpdateMulticastDto,
        userId: number
    ): Promise<Multicast> {
        const existing = await this.multicastRepository.findOneOrFail(id);

        const mappedDataTarget = await this.mapMulticastDtoToMulticast(
            updateMulticastDto,
            existing
        );

        mappedDataTarget.updatedBy = userId;
        const res = this.multicastRepository.save(mappedDataTarget);

        return res;
    }

    async delete(id: number): Promise<DeleteResult> {
        return this.multicastRepository.delete(id);
    }

    private async mapMulticastDtoToMulticast(
        multicastDto: CreateMulticastDto | UpdateMulticastDto,
        multicast: Multicast
    ): Promise<Multicast> {
        multicast.groupName = multicastDto.groupName;
        multicast.address = multicastDto.address;
        multicast.applicationSessionKey = multicastDto.applicationSessionKey;
        multicast.networkSessionKey = multicastDto.networkSessionKey;
        multicast.dataRate = multicastDto.dataRate;
        multicast.frameCounter = multicastDto.frameCounter;
        multicast.frequency = multicastDto.frequency;
        multicast.groupType = multicastDto.groupType;

        if (multicastDto.applicationId != null) {
            try {
                multicast.application = await this.applicationService.findOneWithoutRelations(
                    multicastDto.applicationId
                );
            } catch (err) {
                this.logger.error(
                    `Could not find application with id: ${multicastDto.applicationId}`
                );

                throw new BadRequestException(ErrorCodes.IdDoesNotExists);
            }
        } else {
            throw new BadRequestException(ErrorCodes.IdMissing);
        }

        return multicast;
    }
}
