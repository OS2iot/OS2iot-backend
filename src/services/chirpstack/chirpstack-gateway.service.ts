import {
    BadRequestException,
    HttpService,
    Injectable,
    InternalServerErrorException,
    Logger,
    NotFoundException,
} from "@nestjs/common";
import { AxiosResponse } from "axios";

import { ChirpstackErrorResponseDto } from "@dto/chirpstack/chirpstack-error-response.dto";
import { ChirpstackResponseStatus } from "@dto/chirpstack/chirpstack-response.dto";
import { CreateGatewayDto } from "@dto/chirpstack/create-gateway.dto";
import { GatewayStatsResponseDto } from "@dto/chirpstack/gateway-stats.response.dto";
import { ListAllGatewaysResponseDto } from "@dto/chirpstack/list-all-gateways.dto";
import { SingleGatewayResponseDto } from "@dto/chirpstack/single-gateway-response.dto";
import {
    UpdateGatewayContentsDto,
    UpdateGatewayDto,
} from "@dto/chirpstack/update-gateway.dto";
import { ErrorCodes } from "@enum/error-codes.enum";
import { GenericChirpstackConfigurationService } from "@services/chirpstack/generic-chirpstack-configuration.service";
import { ChirpstackSetupNetworkServerService } from "@services/chirpstack/network-server.service";
import { GatewayContentsDto } from "@dto/chirpstack/gateway-contents.dto";
import * as _ from "lodash";
import { AuthenticatedRequest } from "@dto/internal/authenticated-request";
import { checkIfUserHasWriteAccessToOrganization } from "@helpers/security-helper";

@Injectable()
export class ChirpstackGatewayService extends GenericChirpstackConfigurationService {
    constructor(
        internalHttpService: HttpService,
        private chirpstackSetupNetworkServerService: ChirpstackSetupNetworkServerService
    ) {
        super(internalHttpService);
    }
    GATEWAY_STATS_INTERVAL_IN_DAYS = 29;
    private readonly logger = new Logger(ChirpstackGatewayService.name, true);
    private readonly ORG_ID_KEY = "internalOrganizationId";
    private readonly UPDATED_BY_KEY = "os2iot-updated-by";
    private readonly CREATED_BY_KEY = "os2iot-created-by";

    async createNewGateway(
        dto: CreateGatewayDto,
        userId: number
    ): Promise<ChirpstackResponseStatus> {
        dto.gateway = await this.updateDtoContents(dto.gateway);

        dto.gateway.tags = this.addOrganizationToTags(dto);
        dto.gateway.tags = this.addUserToTags(dto, userId);

        const result = await this.post("gateways", dto);
        return this.handlePossibleError(result, dto);
    }

    addUserToTags(
        dto: CreateGatewayDto,
        userId: number
    ): { [id: string]: string | number } {
        const tags = dto.gateway.tags;
        tags[this.CREATED_BY_KEY] = `${userId}`;
        tags[this.UPDATED_BY_KEY] = `${userId}`;
        return tags;
    }

    updateUpdatedByTag(
        dto: UpdateGatewayDto,
        userId: number
    ): { [id: string]: string | number } {
        const tags = dto.gateway.tags;
        tags[this.UPDATED_BY_KEY] = `${userId}`;
        return tags;
    }

    addOrganizationToTags(dto: CreateGatewayDto): { [id: string]: string | number } {
        const tags = dto.gateway.tags;
        tags[this.ORG_ID_KEY] = `${dto.organizationId}`;
        return tags;
    }

    async listAllPaginated(
        limit?: number,
        offset?: number,
        organizationId?: number
    ): Promise<ListAllGatewaysResponseDto> {
        // Default parameters if not set
        if (!offset) {
            offset = 0;
        }
        if (!limit) {
            limit = 100;
        }
        const results = await this.getAllWithPagination<ListAllGatewaysResponseDto>(
            "gateways",
            limit,
            offset
        );
        await Promise.all(
            results.result.map(async x => {
                const gw = await this.getOne(x.id);
                x.internalOrganizationId = gw.gateway.internalOrganizationId;
                x.updatedBy = gw.gateway.updatedBy;
                x.updatedBy = gw.gateway.updatedBy;
                // x.tags = gw.gateway.tags;
                // x.tags[this.ORG_ID_KEY] = undefined;
            })
        );
        if (organizationId !== undefined) {
            const filteredResults = _.filter(results.result, x => {
                return x.internalOrganizationId === +organizationId;
            });
            return {
                result: filteredResults,
                totalCount: filteredResults.length,
            };
        }

        return results;
    }

    async getOne(gatewayId: string): Promise<SingleGatewayResponseDto> {
        if (gatewayId?.length != 16) {
            throw new BadRequestException("Invalid gateway id");
        }
        try {
            const result: SingleGatewayResponseDto = await this.get(
                `gateways/${gatewayId}`
            );
            result.gateway.internalOrganizationId = +result.gateway.tags[this.ORG_ID_KEY];
            result.gateway.createdBy = +result.gateway.tags[this.CREATED_BY_KEY];
            result.gateway.updatedBy = +result.gateway.tags[this.UPDATED_BY_KEY];
            result.gateway.tags[this.ORG_ID_KEY] = undefined;
            result.gateway.tags[this.CREATED_BY_KEY] = undefined;
            result.gateway.tags[this.UPDATED_BY_KEY] = undefined;

            result.stats = (await this.getGatewayStats(gatewayId)).result;

            return result;
        } catch (err) {
            Logger.error(
                `Tried to find gateway with id: '${gatewayId}', got an error: ${JSON.stringify(
                    err
                )}`
            );
            if (err?.message == "object does not exist") {
                throw new NotFoundException(ErrorCodes.IdDoesNotExists);
            }
            throw new InternalServerErrorException(err?.response?.data);
        }
    }

    private async getGatewayStats(gatewayId: string): Promise<GatewayStatsResponseDto> {
        const now = new Date();
        const to_time = now.toISOString();
        const from_time = new Date(
            new Date().setDate(now.getDate() - this.GATEWAY_STATS_INTERVAL_IN_DAYS)
        ).toISOString();

        return await this.get<GatewayStatsResponseDto>(
            `gateways/${gatewayId}/stats?interval=DAY&startTimestamp=${from_time}&endTimestamp=${to_time}`
        );
    }

    async modifyGateway(
        gatewayId: string,
        dto: UpdateGatewayDto,
        req: AuthenticatedRequest
    ): Promise<ChirpstackResponseStatus> {
        dto.gateway = await this.updateDtoContents(dto.gateway);
        dto.gateway.tags = await this.ensureOrganizationIdIsSet(gatewayId, dto, req);
        dto.gateway.tags = this.updateUpdatedByTag(dto, +req.user.userId);
        const result = await this.put("gateways", dto, gatewayId);
        return this.handlePossibleError(result, dto);
    }

    async ensureOrganizationIdIsSet(
        gatewayId: string,
        dto: UpdateGatewayDto,
        req: AuthenticatedRequest
    ): Promise<{ [id: string]: string | number }> {
        const existing = await this.getOne(gatewayId);
        const tags = dto.gateway.tags;
        tags[this.ORG_ID_KEY] = `${existing.gateway.internalOrganizationId}`;
        if (tags[this.ORG_ID_KEY] != null) {
            checkIfUserHasWriteAccessToOrganization(req, +tags[this.ORG_ID_KEY]);
        }
        return tags;
    }

    async deleteGateway(gatewayId: string): Promise<ChirpstackResponseStatus> {
        try {
            await this.delete("gateways", gatewayId);
            return {
                success: true,
            };
        } catch (err) {
            Logger.error(
                `Got error from Chirpstack: ${JSON.stringify(err?.response?.data)}`
            );
            return {
                success: false,
                chirpstackError: err?.response?.data as ChirpstackErrorResponseDto,
            };
        }
    }

    private handlePossibleError(
        result: AxiosResponse,
        dto: CreateGatewayDto | UpdateGatewayDto
    ): ChirpstackResponseStatus {
        if (result.status != 200) {
            Logger.error(
                `Error from Chirpstack: '${JSON.stringify(
                    dto
                )}', got response: ${JSON.stringify(result.data)}`
            );
            throw new BadRequestException({
                success: false,
                error: result.data,
            });
        }

        return { success: true };
    }

    private async updateDtoContents(
        contentsDto: GatewayContentsDto | UpdateGatewayContentsDto
    ): Promise<GatewayContentsDto | UpdateGatewayContentsDto> {
        // Chirpstack requires 'gatewayProfileID' to be set (with value or null)
        if (!contentsDto?.gatewayProfileID) {
            contentsDto.gatewayProfileID = null;
        }

        // Add network server
        if (!contentsDto?.networkServerID) {
            contentsDto.networkServerID = await this.chirpstackSetupNetworkServerService.getDefaultNetworkServerId();
        }

        if (!contentsDto?.organizationID) {
            contentsDto.organizationID = await this.chirpstackSetupNetworkServerService.getDefaultOrganizationId();
        }

        if (contentsDto?.tagsString) {
            contentsDto.tags = JSON.parse(contentsDto.tagsString);
        }

        return contentsDto;
    }
}
