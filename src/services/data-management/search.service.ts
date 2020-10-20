import { ListAllGatewaysReponseDto } from "@dto/chirpstack/list-all-gateways.dto";
import { AuthenticatedRequest } from "@dto/internal/authenticated-request";
import { ListAllSearchResultsResponseDto } from "@dto/list-all-search-results-response.dto";
import { SearchResultDto, SearchResultType } from "@dto/search-result.dto";
import { Application } from "@entities/application.entity";
import { IoTDevice } from "@entities/iot-device.entity";
import { Injectable } from "@nestjs/common";
import { ChirpstackGatewayService } from "@services/chirpstack/chirpstack-gateway.service";
import { isHexadecimal, isUUID } from "class-validator";
import { getManager, SelectQueryBuilder } from "typeorm";

@Injectable()
export class SearchService {
    constructor(private gatewayService: ChirpstackGatewayService) {}

    async findByQuery(
        req: AuthenticatedRequest,
        query: string
    ): Promise<ListAllSearchResultsResponseDto> {
        const trimmedQuery = query.trim();
        let results: SearchResultDto[] = [];

        const gateways = this.findGateways(trimmedQuery);
        const apps = this.findApplications(req, trimmedQuery);
        const devices = this.findIoTDevices(req, trimmedQuery);

        results = this.addResults(await apps, SearchResultType.Application, results);
        results = this.addResults(await devices, SearchResultType.IoTDevice, results);
        results = this.addResults(await gateways, SearchResultType.Gateway, results);

        return {
            data: results,
            count: results.length,
        };
    }

    private async findGateways(trimmedQuery: string): Promise<SearchResultDto[]> {
        const gateways = await this.gatewayService.getAllWithPagination<
            ListAllGatewaysReponseDto
        >(`gateways?search=${trimmedQuery}`, 1000, 0);

        const mapped = gateways.result.map(x => {
            const createdAt = new Date(Date.parse(x.createdAt));
            const updatedAt = new Date(Date.parse(x.updatedAt));

            return new SearchResultDto(x.name, x.id, createdAt, updatedAt);
        });

        return mapped;
    }

    private addResults(
        data: SearchResultDto[],
        type: SearchResultType,
        res: SearchResultDto[]
    ) {
        data.forEach(x => {
            x.type = type;
        });
        return res.concat(data);
    }

    private async findApplications(
        req: AuthenticatedRequest,
        trimmedQuery: string
    ): Promise<SearchResultDto[]> {
        const qb = getManager()
            .createQueryBuilder(Application, "app")
            .where('"app"."name" ilike :name', { name: `%${trimmedQuery}%` });

        return await this.applySecuityAndSelect(req, qb, "app", "id");
    }

    private async findIoTDevices(
        req: AuthenticatedRequest,
        query: string
    ): Promise<SearchResultDto[]> {
        if (isHexadecimal(query)) {
            if (query.length == 16) {
                // LoRaWAN
                return await this.findIoTDevicesByNameOrLoRaWANDeviceID(req, query);
            } else if (query.length >= 4 && query.length <= 12) {
                // Sigfox
                return await this.findIoTDevicesByNameOrSigFoxDeviceId(req, query);
            }
        } else if (isUUID(query)) {
            // Generic
            return await this.findIoTDevicesByNameOrGenericHttpApiKey(req, query);
        }

        return await this.findIoTDevicesByName(req, query);
    }

    private async findIoTDevicesByNameOrGenericHttpApiKey(
        req: AuthenticatedRequest,
        query: string
    ): Promise<SearchResultDto[]> {
        const qb = this.getIoTDeviceQueryBuilder().where(
            `((device.name ilike :name) OR ("device"."apiKey" ilike :id))`,
            {
                name: `%${query}%`,
                id: query,
            }
        );

        return this.applySecuityAndSelect(req, qb, "device", "applicationId");
    }

    private async findIoTDevicesByNameOrSigFoxDeviceId(
        req: AuthenticatedRequest,
        query: string
    ): Promise<SearchResultDto[]> {
        const qb = this.getIoTDeviceQueryBuilder().where(
            `((device.name ilike :name) OR ("device"."deviceId" ilike :id))`,
            {
                name: `%${query}%`,
                id: query,
            }
        );

        return this.applySecuityAndSelect(req, qb, "device", "applicationId");
    }

    private async findIoTDevicesByNameOrLoRaWANDeviceID(
        req: AuthenticatedRequest,
        query: string
    ): Promise<SearchResultDto[]> {
        const qb = this.getIoTDeviceQueryBuilder().where(
            `((device.name ilike :name) OR ("device"."deviceEUI" ilike :id))`,
            {
                name: `%${query}%`,
                id: query,
            }
        );

        return this.applySecuityAndSelect(req, qb, "device", "applicationId");
    }

    private async findIoTDevicesByName(
        req: AuthenticatedRequest,
        query: string
    ): Promise<SearchResultDto[]> {
        const qb = this.getIoTDeviceQueryBuilder().where(`device.name ilike :name`, {
            name: `%${query}%`,
        });

        return this.applySecuityAndSelect(req, qb, "device", "applicationId");
    }

    private getIoTDeviceQueryBuilder() {
        return getManager().createQueryBuilder(IoTDevice, "device");
    }

    private async applySecuityAndSelect<T>(
        req: AuthenticatedRequest,
        qb: SelectQueryBuilder<T>,
        alias: string,
        applicationIdColumn: string
    ): Promise<SearchResultDto[]> {
        if (!req.user.permissions.isGlobalAdmin) {
            if (req.user.permissions.getAllApplicationsWithAtLeastRead().length == 0) {
                return [];
            }
            qb = qb.andWhere(
                `"${alias}"."${applicationIdColumn}" IN (:...allowedApplications)`,
                {
                    allowedApplications: req.user.permissions.getAllApplicationsWithAtLeastRead(),
                }
            );
        }

        const select = qb.select(["id", '"createdAt"', '"updatedAt"', "name"]);
        if (alias == "device") {
            return select.addSelect('"applicationId"', "applicationId").getRawMany();
        }
        return select.getRawMany();
    }
}
