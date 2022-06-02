import {
    GatewayGetAllStatusResponseDto,
    ListAllGatewayStatusDto,
} from "@dto/chirpstack/backend/gateway-all-status.dto";
import { GatewayStatus } from "@dto/chirpstack/backend/gateway-status.dto";
import { GatewayStatusHistory } from "@entities/gateway-status-history.entity";
import {
    GatewayStatusInterval,
    gatewayStatusIntervalToDate,
} from "@enum/gateway-status-interval.enum";
import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, MoreThanOrEqual, Repository } from "typeorm";
import { ChirpstackGatewayService } from "./chirpstack-gateway.service";
import { nameof } from "@helpers/type-helper";

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

        if (!gatewayIds.length) {
            return { count: 0, data: [] };
        }

        const statusHistoriesInPeriod = await this.gatewayStatusHistoryRepository.find({
            where: {
                mac: In(gatewayIds),
                timestamp: MoreThanOrEqual(fromDate),
            },
        });

        // To know the status of each gateway up till the first status since the start date,
        // we must fetch the previous status
        const latestStatusHistoryPerGatewayBeforePeriod = await this.fetchLatestStatusBeforeDate(gatewayIds, fromDate);

        const statusHistories = this.mergeStatusHistories(
            fromDate,
            statusHistoriesInPeriod,
            latestStatusHistoryPerGatewayBeforePeriod
        );

        const data: GatewayStatus[] = this.mapStatusHistoryToGateways(
            gateways.result,
            statusHistories
        );

        return {
            data,
            count: gateways.totalCount,
        };
    }

    public async findOne<Gateway extends GatewayId>(
        gateway: Gateway,
        timeInterval: GatewayStatusInterval
    ): Promise<GatewayStatus> {
        const fromDate = gatewayStatusIntervalToDate(timeInterval);

        const statusHistoriesInPeriod = await this.gatewayStatusHistoryRepository.find({
            where: {
                mac: gateway.id,
                timestamp: MoreThanOrEqual(fromDate),
            },
        });

        const latestStatusHistoryPerGatewayBeforePeriod = await this.fetchLatestStatusBeforeDate([gateway.id], fromDate);

        const statusHistories = this.mergeStatusHistories(
            fromDate,
            statusHistoriesInPeriod,
            latestStatusHistoryPerGatewayBeforePeriod
        );

        return this.mapStatusHistoryToGateway(gateway, statusHistories);
    }

    public findLatestPerGateway(): Promise<GatewayStatusHistory[]> {
        return this.gatewayStatusHistoryRepository
            .createQueryBuilder("status_history")
            .distinctOn([nameof<GatewayStatusHistory>("mac")])
            .orderBy({
                [nameof<GatewayStatusHistory>("mac")]: "ASC",
                [nameof<GatewayStatusHistory>("timestamp")]: "DESC",
            })
            .getMany();
    }

    public createMany(
        histories: GatewayStatusHistory[]
    ): Promise<GatewayStatusHistory[]> {
        return this.gatewayStatusHistoryRepository.save(histories);
    }

    private fetchLatestStatusBeforeDate(gatewayIds: string[], date: Date) {
        return this.gatewayStatusHistoryRepository
            .createQueryBuilder("status_history")
            .where("status_history.mac IN (:...gatewayIds)", { gatewayIds })
            .andWhere("status_history.timestamp < :date", { date })
            .distinctOn([nameof<GatewayStatusHistory>("mac")])
            .orderBy({
                [nameof<GatewayStatusHistory>("mac")]: "ASC",
                [nameof<GatewayStatusHistory>("timestamp")]: "DESC",
            })
            .getMany();
    }

    private mergeStatusHistories(
        fromDate: Date,
        statusHistoriesInPeriod: GatewayStatusHistory[],
        latestStatusHistoryPerGateway: GatewayStatusHistory[]
    ): GatewayStatusHistory[] {
        const combinedHistories = statusHistoriesInPeriod.slice();

        latestStatusHistoryPerGateway.forEach(latestHistory => {
            // Ensure that the timestamp is within the time period
            latestHistory.timestamp = fromDate;
            combinedHistories.push(latestHistory);
        });

        return combinedHistories;
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
