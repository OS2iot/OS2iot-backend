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

    // TODO: Not for this task! Focus on overview
    // public find(gatewayMac: string): Promise<GatewayOnlineHistory[]> {
    //     return this.gatewayOnlineHistoryRepository.find({
    //         where: {
    //             mac: gatewayMac,
    //         },
    //     });
    // }

    public async findAll(
        query: ListAllGatewayStatusDto
    ): Promise<GatewayGetAllStatusResponseDto> {
        const gateways = await this.chirpstackGatewayService.getWithPagination(
            query.limit,
            query.offset,
            query.organizationId
        );
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
            const onlineTimestamps = statusHistories.reduce((res: Date[], history) => {
                if (history.mac === gateway.id) {
                    res.push(history.timestamp);
                }

                return res;
            }, []);

            return {
                id: gateway.id,
                name: gateway.name,
                onlineTimestamps,
            };
        });

        return {
            data,
            count: gateways.totalCount,
        };
    }
}
