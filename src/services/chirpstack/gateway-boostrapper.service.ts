import { ListAllGatewaysResponseDto } from "@dto/chirpstack/list-all-gateways.dto";
import { GatewayStatusHistory } from "@entities/gateway-status-history.entity";
import { Inject, OnApplicationBootstrap } from "@nestjs/common";
import { ChirpstackGatewayService } from "./chirpstack-gateway.service";
import { GatewayStatusHistoryService } from "./gateway-status-history.service";

/**
 * Verify if any gateways exist on chirpstack and haven't been loaded into the database.
 * Populate the database with information for each missing/new gateway.
 */
export class GatewayBootstrapperService implements OnApplicationBootstrap {
    constructor(
        @Inject(GatewayStatusHistoryService)
        private statusHistoryService: GatewayStatusHistoryService,
        @Inject(ChirpstackGatewayService)
        private chirpstackGatewayService: ChirpstackGatewayService
    ) {}

    async onApplicationBootstrap(): Promise<void> {
        const chirpstackGatewaysPromise = this.chirpstackGatewayService.getAll();
        const latestStatusHistories = await this.statusHistoryService.findLatestPerGateway();
        const gateways = await chirpstackGatewaysPromise;
        await this.seedGatewayStatus(gateways, latestStatusHistories);
    }

    /**
     * Populate the gateway status table with an entry for each new gateway.
     * @param gateways All chirpstack gateways
     * @param statusHistories Existing status histories to check against
     */
    private async seedGatewayStatus(gateways: ListAllGatewaysResponseDto, statusHistories: GatewayStatusHistory[]) {
        const now = new Date();
        const errorTime = new Date();
        errorTime.setSeconds(errorTime.getSeconds() - 150);

        // Don't overwrite ones which already have a status history
        const newHistoriesForMissingGateways = gateways.result.reduce((res: GatewayStatusHistory[], gateway) => {
            if (!statusHistories.some(history => history.mac === gateway.gatewayId)) {
                // Best fit is to imitate the status logic from Chirpstack.
                const lastSeenDate = new Date(gateway.lastSeenAt);
                const wasOnline = errorTime.getTime() < lastSeenDate.getTime();

                res.push({
                    mac: gateway.gatewayId,
                    timestamp: now,
                    wasOnline,
                } as GatewayStatusHistory);
            }

            return res;
        }, []);

        if (newHistoriesForMissingGateways.length) {
            await this.statusHistoryService.createMany(newHistoriesForMissingGateways);
        }
    }
}
