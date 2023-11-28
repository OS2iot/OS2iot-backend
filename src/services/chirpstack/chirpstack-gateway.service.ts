import {
    BadRequestException,
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
import { UpdateGatewayContentsDto, UpdateGatewayDto } from "@dto/chirpstack/update-gateway.dto";
import { ErrorCodes } from "@enum/error-codes.enum";
import { GenericChirpstackConfigurationService } from "@services/chirpstack/generic-chirpstack-configuration.service";
import { ChirpstackSetupNetworkServerService } from "@services/chirpstack/network-server.service";
import { GatewayContentsDto } from "@dto/chirpstack/gateway-contents.dto";
import { AuthenticatedRequest } from "@dto/internal/authenticated-request";
import { checkIfUserHasAccessToOrganization, OrganizationAccessScope } from "@helpers/security-helper";
import { HttpService } from "@nestjs/axios";
import { InjectRepository } from "@nestjs/typeorm";
import { Gateway } from "@entities/gateway.entity";
import { Repository } from "typeorm";
import { OrganizationService } from "@services/user-management/organization.service";
import { GatewayResponseDto } from "@dto/chirpstack/gateway-response.dto";
import { CommonLocationDto } from "@dto/chirpstack/common-location.dto";

@Injectable()
export class ChirpstackGatewayService extends GenericChirpstackConfigurationService {
    constructor(
        internalHttpService: HttpService,
        private chirpstackSetupNetworkServerService: ChirpstackSetupNetworkServerService,
        @InjectRepository(Gateway)
        private gatewayRepository: Repository<Gateway>,
        private organizationService: OrganizationService
    ) {
        super(internalHttpService);
    }
    GATEWAY_STATS_INTERVAL_IN_DAYS = 29;
    private readonly logger = new Logger(ChirpstackGatewayService.name, { timestamp: true });
    private readonly ORG_ID_KEY = "internalOrganizationId";
    private readonly UPDATED_BY_KEY = "os2iot-updated-by";
    private readonly CREATED_BY_KEY = "os2iot-created-by";

    async createNewGateway(dto: CreateGatewayDto, userId: number): Promise<ChirpstackResponseStatus> {
        dto.gateway = await this.updateDtoContents(dto.gateway);

        dto.gateway.tags = this.addOrganizationToTags(dto);
        dto.gateway.tags = this.addUserToTags(dto, userId);

        const gateway = this.mapContentsDtoToGateway(dto.gateway);
        gateway.createdBy = userId;
        gateway.updatedBy = userId;
        gateway.rxPacketsReceived = 0;
        gateway.txPacketsEmitted = 0;

        gateway.organization = await this.organizationService.findById(dto.organizationId);

        const result = await this.post("gateways", dto);
        await this.gatewayRepository.save(gateway);
        return this.handlePossibleError(result, dto);
    }

    addUserToTags(dto: CreateGatewayDto, userId: number): { [id: string]: string | number } {
        const tags = dto.gateway.tags;
        tags[this.CREATED_BY_KEY] = `${userId}`;
        tags[this.UPDATED_BY_KEY] = `${userId}`;
        return tags;
    }

    updateUpdatedByTag(dto: UpdateGatewayDto, userId: number): { [id: string]: string | number } {
        const tags = dto.gateway.tags;
        tags[this.UPDATED_BY_KEY] = `${userId}`;
        return tags;
    }

    addOrganizationToTags(dto: CreateGatewayDto): { [id: string]: string | number } {
        const tags = dto.gateway.tags;
        tags[this.ORG_ID_KEY] = `${dto.organizationId}`;
        return tags;
    }

    async getAll(organizationId?: number): Promise<ListAllGatewaysResponseDto> {
        let query = this.gatewayRepository
            .createQueryBuilder("gateway")
            .innerJoinAndSelect("gateway.organization", "organization");

        if (organizationId) {
            query = query.where('"organizationId" = :organizationId', { organizationId });
        }

        const gateways = await query.getMany();

        return {
            result: gateways.map(this.mapGatewayToResponseDto),
            totalCount: gateways.length,
        };
    }

    async getOne(gatewayId: string): Promise<SingleGatewayResponseDto> {
        if (gatewayId?.length != 16) {
            throw new BadRequestException("Invalid gateway id");
        }
        try {
            const result = new SingleGatewayResponseDto();
            const gateway = await this.gatewayRepository.findOne({
                where: { gatewayId },
                relations: { organization: true },
                loadRelationIds: {
                    relations: ["createdBy", "updatedBy"],
                },
            });
            const now = new Date();
            const statsFrom = new Date(new Date().setDate(now.getDate() - this.GATEWAY_STATS_INTERVAL_IN_DAYS));

            result.stats = (await this.getGatewayStats(gatewayId, statsFrom, now)).result;
            result.gateway = this.mapGatewayToResponseDto(gateway);

            return result;
        } catch (err) {
            this.logger.error(`Tried to find gateway with id: '${gatewayId}', got an error: ${JSON.stringify(err)}`);
            if (err?.message == "object does not exist") {
                throw new NotFoundException(ErrorCodes.IdDoesNotExists);
            }
            throw new InternalServerErrorException(err?.response?.data);
        }
    }

    async getGatewayStats(gatewayId: string, from: Date, to: Date): Promise<GatewayStatsResponseDto> {
        const to_time = to.toISOString();
        const from_time = from.toISOString();

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

        const gateway = this.mapContentsDtoToGateway(dto.gateway);
        gateway.gatewayId = gatewayId;
        gateway.updatedBy = req.user.userId;

        const result = await this.put("gateways", dto, gatewayId);
        await this.gatewayRepository.update({ gatewayId }, gateway);
        return this.handlePossibleError(result, dto);
    }

    public async updateGatewayStats(
        gatewayId: string,
        rxPacketsReceived: number,
        txPacketsEmitted: number,
        lastSeenAt: Date | undefined
    ) {
        await this.gatewayRepository.update({ gatewayId }, { rxPacketsReceived, txPacketsEmitted, lastSeenAt });
    }

    async ensureOrganizationIdIsSet(
        gatewayId: string,
        dto: UpdateGatewayDto,
        req: AuthenticatedRequest
    ): Promise<{ [id: string]: string | number }> {
        const existing = await this.getOne(gatewayId);
        const tags = dto.gateway.tags;
        tags[this.ORG_ID_KEY] = `${existing.gateway.organizationId}`;
        // TODO: Interpolated string will never be null?
        if (tags[this.ORG_ID_KEY] != null) {
            checkIfUserHasAccessToOrganization(req, +tags[this.ORG_ID_KEY], OrganizationAccessScope.GatewayWrite);
        }
        return tags;
    }

    async deleteGateway(gatewayId: string): Promise<ChirpstackResponseStatus> {
        try {
            await this.gatewayRepository.delete({ gatewayId });
            await this.delete("gateways", gatewayId);
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

    private handlePossibleError(
        result: AxiosResponse,
        dto: CreateGatewayDto | UpdateGatewayDto
    ): ChirpstackResponseStatus {
        if (result.status != 200) {
            this.logger.error(
                `Error from Chirpstack: '${JSON.stringify(dto)}', got response: ${JSON.stringify(result.data)}`
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
            contentsDto.tags = JSON.parse(contentsDto.tagsString); // TODO: Updaze for new format when chirpstack 4
        }

        contentsDto.id = contentsDto.gatewayId;

        return contentsDto;
    }

    public mapContentsDtoToGateway(dto: GatewayContentsDto) {
        const gateway = new Gateway();
        gateway.name = dto.name;
        gateway.gatewayId = dto.gatewayId;
        gateway.description = dto.description;
        gateway.altitude = dto.location.altitude;
        gateway.location = {
            type: "Point",
            coordinates: [dto.location.longitude, dto.location.latitude],
        };
        gateway.tags = JSON.stringify(dto.tags);

        return gateway;
    }

    private mapGatewayToResponseDto(gateway: Gateway): GatewayResponseDto {
        const responseDto = gateway as unknown as GatewayResponseDto;
        responseDto.organizationId = gateway.organization.id;
        responseDto.organizationName = gateway.organization.name;
        responseDto.tags = JSON.parse(gateway.tags);
        responseDto.tags["internalOrganizationId"] = undefined;
        responseDto.tags["os2iot-updated-by"] = undefined;
        responseDto.tags["os2iot-created-by"] = undefined;

        const commonLocation = new CommonLocationDto();
        commonLocation.latitude = gateway.location.coordinates[1];
        commonLocation.longitude = gateway.location.coordinates[0];
        commonLocation.altitude = gateway.altitude;

        responseDto.location = commonLocation;

        return responseDto;
    }
}
