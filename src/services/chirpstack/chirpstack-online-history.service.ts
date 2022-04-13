import { GatewayOnlineHistory } from "@entities/gateway-online-history.entity";
import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

@Injectable()
export class ChirpstackOnlineHistoryService {
    constructor(
        @InjectRepository(GatewayOnlineHistory)
        private gatewayOnlineHistoryRepository: Repository<GatewayOnlineHistory>
    ) {}
    private readonly logger = new Logger(ChirpstackOnlineHistoryService.name);

    public find(gatewayMac: string): Promise<GatewayOnlineHistory[]> {
        return this.gatewayOnlineHistoryRepository.find({
            where: {
                mac: gatewayMac,
            },
        });
    }
}
