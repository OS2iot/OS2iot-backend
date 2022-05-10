import {
    GatewayGetAllStatusResponseDto,
    ListAllGatewayStatusDto,
} from "@dto/chirpstack/backend/gateway-all-status.dto";
import { GatewayStatus } from "@dto/chirpstack/backend/gateway-status.dto";
import { GatewayStatusHistory } from "@entities/gateway-status-history.entity";
import { gatewayStatusIntervalToDate } from "@enum/gateway-status-interval.enum";
import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, MoreThan, Repository, MoreThanOrEqual } from "typeorm";
import { ChirpstackGatewayService } from "./chirpstack-gateway.service";
import { ListAllGatewaysResponseDto } from "@dto/chirpstack/list-all-gateways.dto";
import { GatewayResponseDto } from "@dto/chirpstack/gateway-response.dto";

type GatewayId = { id: string; name: string };

@Injectable()
export class GatewayStatusHistoryService {
    constructor(
        @InjectRepository(GatewayStatusHistory)
        private gatewayStatusHistoryRepository: Repository<GatewayStatusHistory>,
        private chirpstackGatewayService: ChirpstackGatewayService
    ) {}
    private readonly logger = new Logger(GatewayStatusHistoryService.name);

    public async findAllWithChirpstack(
        query: ListAllGatewayStatusDto
    ): Promise<GatewayGetAllStatusResponseDto> {
        // Very expensive operation. Since no gateway data is stored on the backend database, we need
        // to get them from Chirpstack. There's no filter by tags support so we must fetch all gateways.
        const gateways = await this.chirpstackGatewayService.getAll(query.organizationId);
        const gatewayIds = gateways.result.map(gateway => gateway.id);
        const fromDate = gatewayStatusIntervalToDate(query.timeInterval);

        const statusHistories = await this.gatewayStatusHistoryRepository.find({
            where: {
                mac: In(gatewayIds),
                timestamp: MoreThanOrEqual(fromDate),
            },
        });

        const data: GatewayStatus[] = this.mapStatusHistoryToGateways(
            gateways.result,
            statusHistories
        );

        return {
            data,
            count: gateways.totalCount,
        };
    }

    private mapStatusHistoryToGateways<Gateway extends GatewayId>(
        gateways: Gateway[],
        statusHistories: GatewayStatusHistory[]
    ): GatewayStatus[] {
        return gateways.map(gateway => {
            return this.mapStatusHistoryToGateway(gateway, statusHistories);
        });
    }

    private mapStatusHistoryToGateway<Gateway extends GatewayId>(
        gateway: Gateway,
        statusHistories: GatewayStatusHistory[]
    ) {
        const statusTimestamps = statusHistories.reduce(
            (res: GatewayStatus["statusTimestamps"], history) => {
                if (history.mac === gateway.id) {
                    res.push({
                        timestamp: history.timestamp,
                        wasOnline: history.wasOnline,
                    });
                }

                return res;
            },
            []
        );

        return {
            id: gateway.id,
            name: gateway.name,
            statusTimestamps,
        };
    }
}
