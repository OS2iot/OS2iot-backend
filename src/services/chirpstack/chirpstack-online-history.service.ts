import { GatewayOnlineHistory } from "@entities/gateway-online-history.entity";
import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { GatewayGetAllStatusResponseDto, ListAllGatewayStatusDto } from "@dto/chirpstack/backend/gateway-all-status.dto";
import { GatewayStatus } from "@dto/chirpstack/backend/gateway-status.dto";

@Injectable()
export class ChirpstackOnlineHistoryService {
    constructor(
        @InjectRepository(GatewayOnlineHistory)
        private gatewayOnlineHistoryRepository: Repository<GatewayOnlineHistory>
    ) {}
    private readonly logger = new Logger(ChirpstackOnlineHistoryService.name);

    // TODO: Not for this task! Focus on overview
    public find(gatewayMac: string): Promise<GatewayOnlineHistory[]> {
        return this.gatewayOnlineHistoryRepository.find({
            where: {
                mac: gatewayMac,
            },
        });
    }

    public async findAll(organizationId: number, query?: ListAllGatewayStatusDto, ): Promise<GatewayGetAllStatusResponseDto> {
        const [onlineHistories, count] = await this.gatewayOnlineHistoryRepository.findAndCount({

            take: query.limit,
            skip: query.offset,
        })

        const data: GatewayStatus[] = onlineHistories.map(history => ({id: history.}))

        return {
            data,
            count
        }
    }
}
