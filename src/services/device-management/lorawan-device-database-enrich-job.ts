import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression, Timeout } from "@nestjs/schedule";
import { ChirpstackDeviceService } from "@services/chirpstack/chirpstack-device.service";
import { IoTDeviceService } from "@services/device-management/iot-device.service";
import { ChirpstackGatewayService } from "@services/chirpstack/chirpstack-gateway.service";
import * as BluebirdPromise from "bluebird";
import { OrganizationService } from "@services/user-management/organization.service";
import { InjectRepository } from "@nestjs/typeorm";
import { Gateway } from "@entities/gateway.entity";
import { Repository } from "typeorm";
import { timestampToDate } from "@helpers/date.helper";
import { GetGatewayRequest, GetGatewayResponse } from "@chirpstack/chirpstack-api/api/gateway_pb";
import { GatewayServiceClient } from "@chirpstack/chirpstack-api/api/gateway_grpc_pb";
import { credentials } from "@grpc/grpc-js";
import configuration from "@config/configuration";

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
  baseUrlGRPC = `${configuration()["chirpstack"]["hostname"]}:${configuration()["chirpstack"]["port"]}`;
  private gatewayClient = new GatewayServiceClient(this.baseUrlGRPC, credentials.createInsecure());

  private readonly logger = new Logger(LorawanDeviceDatabaseEnrichJob.name, { timestamp: true });

  @Cron(CronExpression.EVERY_MINUTE)
  async fetchStatusForGateway() {
    // Select all gateways from our database and chirpstack (Cheaper than individual calls)
    const gateways = await this.gatewayService.getAll();
    const chirpstackGateways = await this.gatewayService.getAllGatewaysFromChirpstack();

    // Setup batched fetching of status (Only for today)
    await BluebirdPromise.all(
      BluebirdPromise.map(
        gateways.resultList,
        async gateway => {
          try {
            const fromTime = new Date();
            const fromUtc = new Date(
              Date.UTC(fromTime.getUTCFullYear(), fromTime.getUTCMonth(), fromTime.getUTCDate())
            );

            const statsToday = await this.gatewayService.getGatewayStats(gateway.gatewayId, fromUtc, new Date());
            // Save that to our database
            const stats = statsToday[0];
            const chirpstackGateway = chirpstackGateways.resultList.find(g => g.gatewayId === gateway.gatewayId);

            await this.gatewayService.updateGatewayStats(
              gateway.gatewayId,
              stats.rxPacketsReceived,
              stats.txPacketsEmitted,
              gateway.updatedAt,
              chirpstackGateway.lastSeenAt ? timestampToDate(chirpstackGateway.lastSeenAt) : undefined
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
    const chirpstackGateways = await this.gatewayService.getAllGatewaysFromChirpstack();
    const dbGateways = await this.gatewayService.getAll();
    // Filter for gateways not existing in our database
    const unknownGateways = chirpstackGateways.resultList.filter(
      g => dbGateways.resultList.findIndex(dbGateway => dbGateway.gatewayId === g.gatewayId) === -1
    );
    await BluebirdPromise.all(
      BluebirdPromise.map(
        unknownGateways,
        async x => {
          try {
            const req = new GetGatewayRequest();
            req.setGatewayId(x.gatewayId);

            const gwResponse = await this.gatewayService.get<GetGatewayResponse>(
              `gateways/${x.gatewayId}`,
              this.gatewayClient,
              req
            );
            const chirpstackGateway = gwResponse.getGateway();
            const organizationId = +chirpstackGateway.getTagsMap().get("internalOrganizationId");
            const gateway = this.gatewayService.mapChirpstackGatewayToDatabaseGateway(chirpstackGateway, gwResponse);
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
