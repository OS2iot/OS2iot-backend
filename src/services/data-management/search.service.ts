import { GatewayServiceClient } from "@chirpstack/chirpstack-api/api/gateway_grpc_pb";
import { ListGatewaysRequest } from "@chirpstack/chirpstack-api/api/gateway_pb";
import { ListAllGatewaysResponseGrpcDto } from "@dto/chirpstack/list-all-gateways.dto";
import { AuthenticatedRequest } from "@dto/internal/authenticated-request";
import { ListAllSearchResultsResponseDto } from "@dto/list-all-search-results-response.dto";
import { SearchResultDto, SearchResultType } from "@dto/search-result.dto";
import { Application } from "@entities/application.entity";
import { IoTDevice } from "@entities/iot-device.entity";
import { credentials } from "@grpc/grpc-js";
import { timestampToDate } from "@helpers/date.helper";
import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ChirpstackGatewayService } from "@services/chirpstack/chirpstack-gateway.service";
import { isHexadecimal, isUUID } from "class-validator";
import * as _ from "lodash";
import { Repository, SelectQueryBuilder } from "typeorm";

@Injectable()
export class SearchService {
    constructor(
        private gatewayService: ChirpstackGatewayService,
        @InjectRepository(IoTDevice)
        private iotDeviceRepository: Repository<IoTDevice>,
        @InjectRepository(Application)
        private applicationRepository: Repository<Application>
    ) {}

    private readonly SEARCH_RESULT_LIMIT = 100;
    private readonly logger = new Logger(SearchService.name);

    async findByQuery(
        req: AuthenticatedRequest,
        query: string,
        limit = this.SEARCH_RESULT_LIMIT,
        offset = 0
    ): Promise<ListAllSearchResultsResponseDto> {
        const urlDecoded = decodeURIComponent(query);
        const trimmedQuery = urlDecoded.trim();

        const gatewayPromise = this.findGatewaysAndMapType(trimmedQuery);
        const applicationPromise = this.findApplicationsAndMapType(req, trimmedQuery);
        const devicePromise = this.findDevicesAndMapType(req, trimmedQuery);

        const results = _.filter(
            _.flatMap(await Promise.all([applicationPromise, devicePromise, gatewayPromise])),
            x => x != null
        );

        return {
            data: this.limitAndOrder(results, limit, offset),
            count: results.length,
        };
    }

    private findDevicesAndMapType(req: AuthenticatedRequest, trimmedQuery: string) {
        return this.findIoTDevices(req, trimmedQuery)
            .then(x => {
                return this.addTypeToResults(x, SearchResultType.IoTDevice);
            })
            .catch(err => {
                this.logger.error(`Failed to search for IOTDevice, error: ${err}`);
            });
    }

    private findApplicationsAndMapType(req: AuthenticatedRequest, trimmedQuery: string) {
        return this.findApplications(req, trimmedQuery)
            .then(x => {
                return this.addTypeToResults(x, SearchResultType.Application);
            })
            .catch(err => {
                this.logger.error(`Failed to search for Application, error: ${err}`);
            });
    }

    private findGatewaysAndMapType(trimmedQuery: string) {
        return this.findGateways(trimmedQuery)
            .then(x => {
                return this.addTypeToResults(x, SearchResultType.Gateway);
            })
            .catch(err => {
                this.logger.error(`Failed to search for Gateway, error: ${err}`);
            });
    }

    private limitAndOrder(
        data: SearchResultDto[],
        limit: number,
        offset: number
    ): SearchResultDto[] {
        const r = _.orderBy(data, ["updatedAt"], ["desc"]);
        const sliced = _.slice(r, offset, offset + limit);
        return sliced;
    }

    private async findGateways(trimmedQuery: string): Promise<SearchResultDto[]> {
        const gatewayClient = new GatewayServiceClient(
            this.gatewayService.baseUrlGRPC,
            credentials.createInsecure()
        );
        const escapedQuery = encodeURI(trimmedQuery);
        const req = new ListGatewaysRequest();

        req.setSearch(escapedQuery);
        const gateways = await this.gatewayService.getAllWithPagination<ListAllGatewaysResponseGrpcDto>(
            `gateways?search=${escapedQuery}`,
            1000,
            0,
            gatewayClient,
            req
        );

        const mapped = await Promise.all(
            gateways.resultList.map(async x => {
                const createdAt = timestampToDate(x.createdAt);
                const updatedAt = timestampToDate(x.updatedAt);

                const resultDto = new SearchResultDto(
                    x.name,
                    x.gatewayId,
                    createdAt,
                    updatedAt,
                    x.gatewayId
                );
                const detailedInfo = await this.gatewayService.getOne(x.gatewayId);

                resultDto.organizationId = detailedInfo.gateway.internalOrganizationId;
                return resultDto;
            })
        );

        return mapped;
    }

    private addTypeToResults(data: SearchResultDto[], type: SearchResultType) {
        data.forEach(x => {
            x.type = type;
        });
        return data;
    }

    private async findApplications(
        req: AuthenticatedRequest,
        trimmedQuery: string
    ): Promise<SearchResultDto[]> {
        const qb = this.applicationRepository
            .createQueryBuilder("app")
            .where('"app"."name" ilike :name', { name: `%${trimmedQuery}%` });

        return await this.applySecuityAndSelect(req, qb, "app", "id");
    }

    private async findIoTDevices(
        req: AuthenticatedRequest,
        query: string
    ): Promise<SearchResultDto[]> {
        if (isHexadecimal(query)) {
            if (query.length == 16) {
                // LoRaWAN
                return await this.findIoTDevicesByNameOrLoRaWANDeviceID(req, query);
            } else if (query.length >= 4 && query.length <= 12) {
                // Sigfox
                return await this.findIoTDevicesByNameOrSigFoxDeviceId(req, query);
            }
        } else if (isUUID(query)) {
            // Generic
            return await this.findIoTDevicesByNameOrGenericHttpApiKey(req, query);
        }

        return await this.findIoTDevicesByName(req, query);
    }

    private async findIoTDevicesByNameOrGenericHttpApiKey(
        req: AuthenticatedRequest,
        query: string
    ): Promise<SearchResultDto[]> {
        const qb = this.getIoTDeviceQueryBuilder().where(
            `((device.name ilike :name) OR ("device"."apiKey" ilike :id))`,
            {
                name: `%${query}%`,
                id: query,
            }
        );

        return this.applySecuityAndSelect(req, qb, "device", "applicationId");
    }

    private async findIoTDevicesByNameOrSigFoxDeviceId(
        req: AuthenticatedRequest,
        query: string
    ): Promise<SearchResultDto[]> {
        const qb = this.getIoTDeviceQueryBuilder().where(
            `((device.name ilike :name) OR ("device"."deviceId" ilike :id))`,
            {
                name: `%${query}%`,
                id: query,
            }
        );

        return this.applySecuityAndSelect(req, qb, "device", "applicationId");
    }

    private async findIoTDevicesByNameOrLoRaWANDeviceID(
        req: AuthenticatedRequest,
        query: string
    ): Promise<SearchResultDto[]> {
        const qb = this.getIoTDeviceQueryBuilder().where(
            `((device.name ilike :name) OR ("device"."deviceEUI" ilike :id))`,
            {
                name: `%${query}%`,
                id: query,
            }
        );

        return this.applySecuityAndSelect(req, qb, "device", "applicationId");
    }

    private async findIoTDevicesByName(
        req: AuthenticatedRequest,
        query: string
    ): Promise<SearchResultDto[]> {
        const qb = this.getIoTDeviceQueryBuilder().where(`device.name ilike :name`, {
            name: `%${query}%`,
        });

        return this.applySecuityAndSelect(req, qb, "device", "applicationId");
    }

    private getIoTDeviceQueryBuilder() {
        return this.iotDeviceRepository.createQueryBuilder("device");
    }

    // eslint-disable-next-line max-lines-per-function
    private async applySecuityAndSelect<T>(
        req: AuthenticatedRequest,
        qb: SelectQueryBuilder<T>,
        alias: string,
        applicationIdColumn: string
    ): Promise<SearchResultDto[]> {
        if (!req.user.permissions.isGlobalAdmin) {
            if (req.user.permissions.getAllApplicationsWithAtLeastRead().length == 0) {
                return [];
            }
            qb = qb.andWhere(`"${alias}"."${applicationIdColumn}" IN (:...allowedApplications)`, {
                allowedApplications: req.user.permissions.getAllApplicationsWithAtLeastRead(),
            });
        }

        const toSelect = [
            `"${alias}"."id"`,
            `"${alias}"."createdAt"`,
            `"${alias}"."updatedAt"`,
            `"${alias}"."name"`,
        ];
        const select = qb;
        if (alias == "device") {
            return select
                .select(toSelect.concat(['"deviceId"', '"deviceEUI"', '"apiKey"']))
                .addSelect('"type"', "deviceType")
                .addSelect('"applicationId"', "applicationId")
                .leftJoin("application", "app", '"app"."id" = "device"."applicationId"')
                .addSelect('"app"."belongsToId"', "organizationId")
                .getRawMany();
        } else if (alias == "app") {
            return select
                .select(toSelect)
                .addSelect('"app"."belongsToId"', "organizationId")
                .getRawMany();
        }
    }
}
