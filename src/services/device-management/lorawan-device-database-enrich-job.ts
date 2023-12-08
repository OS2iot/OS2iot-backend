import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression, Timeout } from "@nestjs/schedule";
import { ChirpstackDeviceService } from "@services/chirpstack/chirpstack-device.service";
import { IoTDeviceService } from "@services/device-management/iot-device.service";
import { ChirpstackGatewayService } from "@services/chirpstack/chirpstack-gateway.service";
import * as BluebirdPromise from "bluebird";
import { ListAllGatewaysResponseDto } from "@dto/chirpstack/list-all-gateways.dto";
import { OrganizationService } from "@services/user-management/organization.service";
import { InjectRepository } from "@nestjs/typeorm";
import { Gateway } from "@entities/gateway.entity";
import { Repository } from "typeorm";

@Injectable()
export class LorawanDeviceDatabaseEnrichJob {
    constructor(
        private chirpstackDeviceService: ChirpstackDeviceService,
        private gatewayService: ChirpstackGatewayService,
        private iotDeviceService: IoTDeviceService,
        private organizationService: OrganizationService,
        @InjectRepository(Gateway)
        private gatewayRepository: Repository<Gateway>
    ) {}

    private readonly logger = new Logger(LorawanDeviceDatabaseEnrichJob.name, { timestamp: true });

    @Cron(CronExpression.EVERY_MINUTE)
    async fetchStatusForGateway() {
        // Select all gateways from our database and chirpstack (Cheaper than individual calls)
        const gateways = await this.gatewayService.getAll();
        const chirpStackGateways = await this.gatewayService.getAllWithPagination<ListAllGatewaysResponseDto>(
            "gateways",
            1000,
            0
        );

        // Setup batched fetching of status (Only for today)
        await BluebirdPromise.all(
            BluebirdPromise.map(
                gateways.result,
                async gateway => {
                    try {
                        const fromTime = new Date();
                        const fromUtc = new Date(
                            Date.UTC(fromTime.getUTCFullYear(), fromTime.getUTCMonth(), fromTime.getUTCDate())
                        );

                        const statsToday = await this.gatewayService.getGatewayStats(
                            gateway.gatewayId,
                            fromUtc,
                            new Date()
                        );
                        // Save that to our database
                        const stats = statsToday.result[0];
                        const chirpstackGateway = chirpStackGateways.result.find(
                            g => g.id.toString() === gateway.gatewayId
                        );

                        await this.gatewayService.updateGatewayStats(
                            gateway.gatewayId,
                            stats.rxPacketsReceived,
                            stats.txPacketsEmitted,
                            chirpstackGateway.lastSeenAt
                        );
                    } catch (err) {
                        this.logger.error(`Gateway status fetch failed with: ${JSON.stringify(err)}`, err);
                    }
                },
                {
                    concurrency: 20,
                }
            )
        );
    }

    @Timeout(30000)
    async enrichLoRaWANDeviceDatabase() {
        // Select lora devices without appId in the database
        const devices = await this.iotDeviceService.findNonEnrichedLoRaWANDevices();

        // Enrich from chirpstack batched
        await BluebirdPromise.all(
            BluebirdPromise.map(
                devices,
                async device => {
                    try {
                        const enrichedDevice = await this.chirpstackDeviceService.enrichLoRaWANDevice(device);
                        await this.iotDeviceService.updateLocalLoRaWANDevices([enrichedDevice]);
                    } catch (err) {
                        this.logger.error(`Database sync of lora devices failed with: ${JSON.stringify(err)}`, err);
                    }
                },
                {
                    concurrency: 10,
                }
            )
        );
    }

    // This is run once on startup and will create any gateways that exist in chirpstack but not our database
    @Timeout(10000)
    async importChirpstackGateways() {
        // Get all chirpstack gateways
        const chirpStackGateways = await this.gatewayService.getAllWithPagination<ListAllGatewaysResponseDto>(
            "gateways",
            1000,
            0
        );

        const dbGateways = await this.gatewayService.getAll();

        // Filter for gateways not existing in our database
        const unknownGateways = chirpStackGateways.result.filter(
            g => dbGateways.result.findIndex(dbGateway => dbGateway.gatewayId === g.id.toString()) === -1
        );

        await BluebirdPromise.all(
            BluebirdPromise.map(
                unknownGateways,
                async x => {
                    try {
                        const gw = (await this.gatewayService.get(`gateways/${x.id}`)) as any;
                        const organizationId = gw.gateway.tags["internalOrganizationId"];

                        const gateway = this.gatewayService.mapContentsDtoToGateway(gw.gateway);
                        gateway.id = 0;
                        gateway.gatewayId = gw.gateway.id;
                        gateway.lastSeenAt = gw.lastSeenAt;
                        gateway.createdAt = new Date(Date.parse(gw.createdAt));
                        gateway.rxPacketsReceived = 0;
                        gateway.txPacketsEmitted = 0;
                        gateway.createdBy = gw.gateway.tags["os2iot-created-by"];
                        gateway.organization = await this.organizationService.findById(organizationId);
                        await this.gatewayRepository.save(gateway);
                    } catch (err) {
                        this.logger.error(`Database sync of gateways failed with: ${JSON.stringify(err)}`, err);
                    }
                },
                {
                    concurrency: 10,
                }
            )
        );
    }
}
