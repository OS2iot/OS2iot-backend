import {
    BadRequestException,
    Injectable,
    InternalServerErrorException,
    Logger,
    NotFoundException,
} from "@nestjs/common";
import { AxiosResponse } from "axios";
import * as BluebirdPromise from "bluebird";
import { ChirpstackErrorResponseDto } from "@dto/chirpstack/chirpstack-error-response.dto";
import { ChirpstackResponseStatus } from "@dto/chirpstack/chirpstack-response.dto";
import { CreateGatewayDto } from "@dto/chirpstack/create-gateway.dto";
import { GatewayStatsElementDto } from "@dto/chirpstack/gateway-stats.response.dto";
import { ListAllGatewaysResponseGrpcDto } from "@dto/chirpstack/list-all-gateways.dto";
import { SingleGatewayResponseDto } from "@dto/chirpstack/single-gateway-response.dto";
import { UpdateGatewayContentsDto, UpdateGatewayDto } from "@dto/chirpstack/update-gateway.dto";
import { ErrorCodes } from "@enum/error-codes.enum";
import { GenericChirpstackConfigurationService } from "@services/chirpstack/generic-chirpstack-configuration.service";
import { GatewayContentsDto } from "@dto/chirpstack/gateway-contents.dto";
import * as _ from "lodash";
import { AuthenticatedRequest } from "@dto/internal/authenticated-request";
import {
    checkIfUserHasAccessToOrganization,
    OrganizationAccessScope,
} from "@helpers/security-helper";
import { GatewayResponseGrpcDto } from "@dto/chirpstack/gateway-response.dto";
import { GatewayServiceClient } from "@chirpstack/chirpstack-api/api/gateway_grpc_pb";
import {
    CreateGatewayRequest,
    DeleteGatewayRequest,
    Gateway,
    GetGatewayMetricsRequest,
    GetGatewayMetricsResponse,
    GetGatewayRequest,
    GetGatewayResponse,
    ListGatewaysRequest,
    ListGatewaysResponse,
    UpdateGatewayRequest,
} from "@chirpstack/chirpstack-api/api/gateway_pb";
import { credentials } from "@grpc/grpc-js";
import { Timestamp } from "google-protobuf/google/protobuf/timestamp_pb";
import { Aggregation, Location } from "@chirpstack/chirpstack-api/common/common_pb";
import { dateToTimestamp } from "@helpers/date.helper";
@Injectable()
export class ChirpstackGatewayService extends GenericChirpstackConfigurationService {
    constructor() {
        super();
    }
    GATEWAY_STATS_INTERVAL_IN_DAYS = 29;
    private readonly logger = new Logger(ChirpstackGatewayService.name, {
        timestamp: true,
    });
    private readonly ORG_ID_KEY = "internalOrganizationId";
    private readonly UPDATED_BY_KEY = "os2iot-updated-by";
    private readonly CREATED_BY_KEY = "os2iot-created-by";
    private gatewayClient = new GatewayServiceClient(
        this.baseUrlGRPC,
        credentials.createInsecure()
    );
    async createNewGateway(
        dto: CreateGatewayDto,
        userId: number
    ): Promise<ChirpstackResponseStatus> {
        dto.gateway = await this.updateDtoContents(dto.gateway);

        dto.gateway.tags = this.addOrganizationToTags(dto);
        dto.gateway.tags = this.addUserToTags(dto, userId);

        const req = new CreateGatewayRequest();
        const location = new Location();
        this.mapToLocationChirpstack(location, dto);

        const gateway = new Gateway();
        await this.mapToGatewayChirpstack(gateway, dto, location);
        Object.entries(dto.gateway.tags).forEach(([key, value]) => {
            gateway.getTagsMap().set(key, value);
        });
        req.setGateway(gateway);
        try {
            await this.post("gateways", this.gatewayClient, req);
            return { success: true };
        } catch (e) {
            this.logger.error(
                `Error from Chirpstack: '${JSON.stringify(dto)}', got response: ${JSON.stringify(
                    e
                )}`
            );
            throw new BadRequestException({
                success: false,
                error: e,
            });
        }
    }

    async mapToGatewayChirpstack(
        gateway: Gateway,
        dto: CreateGatewayDto | UpdateGatewayDto,
        location: Location,
        gatewayId?: string
    ) {
        gateway.setGatewayId(gatewayId ? gatewayId : dto.gateway.gatewayId);
        gateway.setDescription(dto.gateway.description);
        gateway.setName(dto.gateway.name);
        gateway.setLocation(location);
        gateway.setStatsInterval(30);
        gateway.setTenantId(
            dto.gateway.tenantId ? dto.gateway.tenantId : await this.getDefaultOrganizationId()
        );
    }
    mapToLocationChirpstack(location: Location, dto: CreateGatewayDto | UpdateGatewayDto) {
        location.setAccuracy(dto.gateway.location.accuracy);
        location.setAltitude(dto.gateway.location.altitude);
        location.setLatitude(dto.gateway.location.latitude);
        location.setLongitude(dto.gateway.location.longitude);
        location.setSource(dto.gateway.location.source);
    }

    addUserToTags(dto: CreateGatewayDto, userId: number): { [id: string]: string } {
        const tags = dto.gateway.tags;
        tags[this.CREATED_BY_KEY] = `${userId}`;
        tags[this.UPDATED_BY_KEY] = `${userId}`;
        return tags;
    }

    updateTags(dto: UpdateGatewayDto, userId: number): { [id: string]: string } {
        const tags = dto.gateway.tags;
        tags[this.UPDATED_BY_KEY] = `${userId}`;
        tags[this.CREATED_BY_KEY] = `${dto.gateway.createdBy}`;
        return tags;
    }

    addOrganizationToTags(dto: CreateGatewayDto): { [id: string]: string } {
        const tags = dto.gateway.tags;
        tags[this.ORG_ID_KEY] = `${dto.organizationId}`;
        return tags;
    }

    async getAll(organizationId?: number): Promise<ListAllGatewaysResponseGrpcDto> {
        const limit = 1000;
        let allResults: GatewayResponseGrpcDto[] = [];
        let totalCount = 0;
        let lastResults: ListGatewaysResponse.AsObject;
        const req = new ListGatewaysRequest();
        do {
            try {
                lastResults = await this.getAllWithPagination<ListGatewaysResponse.AsObject>(
                    "gateways",
                    limit,
                    allResults.length,
                    this.gatewayClient,
                    req
                );
            } catch (err) {
                throw err;
            }
            allResults = _.union(allResults, lastResults.resultList);
            totalCount = lastResults.totalCount;
        } while (totalCount > allResults.length && lastResults.resultList.length > 0);

        await this.enrichWithOrganizationId(allResults);
        if (organizationId !== undefined) {
            const filteredResults = _.filter(allResults, x => {
                return x.internalOrganizationId === +organizationId;
            });
            return {
                resultList: filteredResults,
                totalCount: filteredResults.length,
            };
        }

        return {
            resultList: allResults,
            totalCount: totalCount,
        };
    }
    /**
     * Fetch gateways individually. This gives us the tags which contain the OS2 organization id.
     * This is a very expensive operation, but it's the only way to retrieve gateway tags.
     * @param results
     */
    private async enrichWithOrganizationId(results: GatewayResponseGrpcDto[]) {
        await BluebirdPromise.all(
            BluebirdPromise.map(
                results,
                async x => {
                    try {
                        const gw = await this.getOne(x.gatewayId);
                        x.internalOrganizationId = gw.gateway.internalOrganizationId;
                    } catch (err) {
                        this.logger.error(
                            `Failed to fetch gateway details for id ${x.gatewayId}`,
                            err
                        );
                        x.internalOrganizationId = null;
                    }
                },
                {
                    concurrency: 50,
                }
            )
        );
    }
    async mapSingleGatewayResponse(result: GetGatewayResponse, gatewayId: string) {
        const gatewayReponseObject: SingleGatewayResponseDto = {
            createdAt: result.getCreatedAt()?.toDate(),
            lastSeenAt: result.getLastSeenAt()?.toObject(),
            updatedAt: result.getUpdatedAt()?.toDate(),
            stats: await this.getGatewayStats(gatewayId),
            gateway: result.getGateway()?.toObject(),
        };
        gatewayReponseObject.gateway.internalOrganizationId = +result
            .getGateway()
            .getTagsMap()
            .get(this.ORG_ID_KEY);
        gatewayReponseObject.gateway.createdBy = +result
            .getGateway()
            .getTagsMap()
            .get(this.CREATED_BY_KEY);
        gatewayReponseObject.gateway.updatedBy = +result
            .getGateway()
            .getTagsMap()
            .get(this.UPDATED_BY_KEY);

        //Filter out specific tags.
        gatewayReponseObject.gateway.tagsMap = gatewayReponseObject.gateway.tagsMap.filter(
            ([key]) => {
                return (
                    key !== this.ORG_ID_KEY &&
                    key !== this.CREATED_BY_KEY &&
                    key !== this.UPDATED_BY_KEY
                );
            }
        );
        return gatewayReponseObject;
    }
    async getOne(gatewayId: string): Promise<SingleGatewayResponseDto> {
        if (gatewayId?.length != 16) {
            throw new BadRequestException("Invalid gateway id");
        }
        const req = new GetGatewayRequest();
        req.setGatewayId(gatewayId);
        try {
            const result = await this.get<GetGatewayResponse>(
                `gateways/${gatewayId}`,
                this.gatewayClient,
                req
            );
            const gatewayReponseObject = this.mapSingleGatewayResponse(result, gatewayId);
            return gatewayReponseObject;
        } catch (err) {
            this.logger.error(
                `Tried to find gateway with id: '${gatewayId}', got an error: ${JSON.stringify(
                    err.message
                )}`
            );
            if (err?.message == "object does not exist") {
                throw new NotFoundException(ErrorCodes.IdDoesNotExists);
            }
            throw new InternalServerErrorException(err?.response?.data);
        }
    }

    private async getGatewayStats(gatewayId: string): Promise<GatewayStatsElementDto[]> {
        const now = new Date();
        const to_time = dateToTimestamp(now);
        const from_time = new Date(
            new Date().setDate(now.getDate() - this.GATEWAY_STATS_INTERVAL_IN_DAYS)
        );
        const from_time_timestamp: Timestamp = dateToTimestamp(from_time);

        const request = new GetGatewayMetricsRequest();
        request.setGatewayId(gatewayId);
        request.setStart(from_time_timestamp);
        request.setEnd(to_time);
        request.setAggregation(Aggregation.DAY);

        const metaData = this.makeMetadataHeader();

        const getGatewayMetricsPromise = new Promise<GetGatewayMetricsResponse>(
            (resolve, reject) => {
                this.gatewayClient.getMetrics(request, metaData, (err, resp) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(resp);
                    }
                });
            }
        );
        try {
            const metrics = await getGatewayMetricsPromise;
            return this.mapPackets(metrics);
        } catch (err) {
            throw new BadRequestException(err);
        }
    }

    private mapPackets(metrics: GetGatewayMetricsResponse) {
        const gatewayResponseDto: GatewayStatsElementDto[] = [];
        const packetCounts: { [timestamp: string]: { rx: number; tx: number } } = {};

        const rxTimestamps = metrics.getRxPackets().getTimestampsList();
        const rxPackets = metrics
            .getRxPackets()
            .getDatasetsList()
            .find(e => e.getLabel() === "rx_count")
            .getDataList();

        this.processPackets(rxTimestamps, rxPackets, "rx", packetCounts);

        const txTimestamps = metrics.getTxPackets().getTimestampsList();
        const txPackets = metrics
            .getTxPackets()
            .getDatasetsList()
            .find(e => e.getLabel() === "tx_count")
            .getDataList();

        this.processPackets(txTimestamps, txPackets, "tx", packetCounts);

        Object.keys(packetCounts).forEach(timestamp => {
            const packetCount = packetCounts[timestamp];
            const dto: GatewayStatsElementDto = {
                timestamp,
                rxPacketsReceived: packetCount.rx,
                txPacketsEmitted: packetCount.tx,
            };
            gatewayResponseDto.push(dto);
        });
        return gatewayResponseDto;
    }

    private processPackets(
        timestamps: Array<Timestamp>,
        packets: number[],
        key: string,
        packetCounts: { [timestamp: string]: { rx: number; tx: number } }
    ) {
        timestamps.forEach((timestamp, index) => {
            const isoTimestamp = timestamp.toDate().toISOString();
            packetCounts[isoTimestamp] = packetCounts[isoTimestamp] || { rx: 0, tx: 0 };
            (packetCounts[isoTimestamp] as any)[key] = packets[index];
        });
    }

    async modifyGateway(
        gatewayId: string,
        dto: UpdateGatewayDto,
        req: AuthenticatedRequest
    ): Promise<ChirpstackResponseStatus> {
        dto.gateway = await this.updateDtoContents(dto.gateway);
        dto.gateway.tags = await this.ensureOrganizationIdIsSet(gatewayId, dto, req);
        dto.gateway.tags = this.updateTags(dto, +req.user.userId);

        const request = new UpdateGatewayRequest();
        const location = new Location();
        this.mapToLocationChirpstack(location, dto);

        const gateway = new Gateway();
        await this.mapToGatewayChirpstack(gateway, dto, location, gatewayId);

        Object.entries(dto.gateway.tags).forEach(([key, value]) => {
            gateway.getTagsMap().set(key, value);
        });

        request.setGateway(gateway);
        try {
            await this.put("gateways", this.gatewayClient, request);
            return { success: true };
        } catch (e) {
            this.logger.error(
                `Error from Chirpstack: '${JSON.stringify(dto)}', got response: ${JSON.stringify(
                    e
                )}`
            );
            throw new BadRequestException({
                success: false,
                error: e,
            });
        }
    }

    async ensureOrganizationIdIsSet(
        gatewayId: string,
        dto: UpdateGatewayDto,
        req: AuthenticatedRequest
    ): Promise<{ [id: string]: string }> {
        const existing = await this.getOne(gatewayId);
        const tags = dto.gateway.tags;
        tags[this.ORG_ID_KEY] = `${existing.gateway.internalOrganizationId}`;
        // TODO: Interpolated string will never be null?
        if (tags[this.ORG_ID_KEY] != null) {
            checkIfUserHasAccessToOrganization(
                req,
                +tags[this.ORG_ID_KEY],
                OrganizationAccessScope.GatewayWrite
            );
        }
        return tags;
    }

    async deleteGateway(gatewayId: string): Promise<ChirpstackResponseStatus> {
        const req = new DeleteGatewayRequest();
        req.setGatewayId(gatewayId);
        try {
            await this.delete("gateways", this.gatewayClient, req);
            return {
                success: true,
            };
        } catch (err) {
            this.logger.error(`Got error from Chirpstack: ${JSON.stringify(err?.response?.data)}`);
            return {
                success: false,
                chirpstackError: err?.response?.data as ChirpstackErrorResponseDto,
            };
        }
    }

    private async updateDtoContents(
        contentsDto: GatewayContentsDto | UpdateGatewayContentsDto
    ): Promise<GatewayContentsDto | UpdateGatewayContentsDto> {
        // Chirpstack requires 'gatewayProfileID' to be set (with value or null)
        if (!contentsDto?.gatewayProfileID) {
            contentsDto.gatewayProfileID = null;
        }

        if (contentsDto?.tagsString) {
            contentsDto.tags = JSON.parse(contentsDto.tagsString);
        }
        return contentsDto;
    }
}
