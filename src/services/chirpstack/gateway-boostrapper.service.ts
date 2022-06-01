import { OnApplicationBootstrap, Inject } from "@nestjs/common";
import { GatewayStatusHistoryService } from "./gateway-status-history.service";
import { ChirpstackGatewayService } from "./chirpstack-gateway.service";
import { GatewayStatusHistory } from "@entities/gateway-status-history.entity";

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
        const now = new Date();
        const errorTime = new Date();
        errorTime.setSeconds(errorTime.getSeconds() - 150);

        // Don't overwrite ones which already have a status history
        const newHistoriesForMissingGateways = gateways.result.reduce(
            (res: GatewayStatusHistory[], gateway) => {
                if (!latestStatusHistories.some(history => history.mac === gateway.id)) {
                    // Best fit is to imitate the status logic from Chirpstack.
                    const lastSeenDate = new Date(gateway.lastSeenAt);
                    const wasOnline = errorTime.getTime() < lastSeenDate.getTime();

                    res.push({
                        mac: gateway.id,
                        timestamp: now,
                        wasOnline,
                    } as GatewayStatusHistory);
                }

                return res;
            },
            []
        );

        if (newHistoriesForMissingGateways.length) {
            await this.statusHistoryService.createMany(newHistoriesForMissingGateways);
        }
    }
}
