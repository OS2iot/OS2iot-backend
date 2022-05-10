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
            take: query.limit,
            skip: query.offset,
        });

        const data: GatewayStatus[] = gateways.result.map(gateway => {
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
        });

        return {
            data,
            count: gateways.totalCount,
        };
    }
}