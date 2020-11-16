import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import {
    DCATRootObject,
    Dataset,
    ContactPoint,
    Distribution,
} from "@dto/open-data-dk-dcat.dto";
import { OpenDataDkDataset } from "@entities/open-data-dk-dataset.entity";
import { Organization } from "@entities/organization.entity";
import { PayloadDecoderExecutorService } from "./payload-decoder-executor.service";
import { IoTDevicePayloadDecoderDataTargetConnection } from "@entities/iot-device-payload-decoder-data-target-connection.entity";
import { IoTDevice } from "@entities/iot-device.entity";

@Injectable()
export class OpenDataDkSharingService {
    constructor(
        @InjectRepository(OpenDataDkDataset)
        private repository: Repository<OpenDataDkDataset>,
        private payloadDecoderExecutorService: PayloadDecoderExecutorService
    ) {}

    private readonly logger = new Logger(OpenDataDkSharingService.name);

    async getDecodedDataInDataset(dataset: OpenDataDkDataset) {
        const rawData = await this.repository
            .createQueryBuilder("dataset")
            .innerJoinAndSelect("dataset.dataTarget", "dt")
            .innerJoinAndSelect("dt.connections", "connections")
            .innerJoinAndSelect("connections.iotDevices", "devices")
            .leftJoinAndSelect("connections.payloadDecoder", "pd")
            .innerJoinAndSelect("devices.latestReceivedMessage", "msg")
            .where("dataset.id = :id", { id: dataset.id })
            .getOne();

        return this.decodeData(rawData);
    }

    private decodeData(rawData: OpenDataDkDataset) {
        // TODO: Do this in parallel
        const results: any[] = [];
        rawData.dataTarget.connections.forEach(connection => {
            this.logger.debug(`Got connection(${connection.id})`);
            connection.iotDevices.forEach(device => {
                this.decodeDevice(device, connection, results);
            });
        });
        return results;
    }

    private decodeDevice(
        device: IoTDevice,
        connection: IoTDevicePayloadDecoderDataTargetConnection,
        results: any[]
    ) {
        this.logger.debug(`Doing device ${device.name} / ${device.id}`);
        if (!device.latestReceivedMessage) {
            this.logger.debug(
                `Device ${device.name} / ${device.id} has no data ... skipping`
            );
            return;
        }

        if (connection.payloadDecoder != null) {
            const decoded = this.payloadDecoderExecutorService.callUntrustedCode(
                connection.payloadDecoder.decodingFunction,
                device,
                device.latestReceivedMessage.rawData
            );
            results.push(decoded);
        } else {
            results.push(device.latestReceivedMessage);
        }
    }

    async createDCAT(organization: Organization): Promise<DCATRootObject> {
        const datasets = await this.getAllOpenDataDkSharesForOrganization(organization);

        return this.mapToDCAT(organization, datasets);
    }

    async findById(shareId: number, organizationId: number): Promise<OpenDataDkDataset> {
        return await this.findDatasetWithRelations()
            .where("dataset.id = :datasetId and org.id = :organizationId", {
                datasetId: shareId,
                organizationId: organizationId,
            })
            .getOne();
    }

    async getAllOpenDataDkSharesForOrganization(
        organization: Organization
    ): Promise<OpenDataDkDataset[]> {
        return this.findDatasetWithRelations()
            .where("org.id = :orgId", { orgId: organization.id })
            .getMany();
    }

    private findDatasetWithRelations() {
        return this.repository
            .createQueryBuilder("dataset")
            .innerJoin("dataset.dataTarget", "dt")
            .innerJoin("dt.application", "app")
            .innerJoin("app.belongsTo", "org");
    }

    private mapToDCAT(
        organization: Organization,
        datasets: OpenDataDkDataset[]
    ): DCATRootObject {
        const root = new DCATRootObject();
        root["@context"] = "https://project-open-data.cio.gov/v1.1/schema/catalog.jsonld";
        root["@type"] = "dcat:Catalog";
        root.conformsTo = "https://project-open-data.cio.gov/v1.1/schema";
        root.describedBy = "https://project-open-data.cio.gov/v1.1/schema/catalog.json";

        root.dataset = datasets.map(x => {
            return this.mapDataset(organization, x);
        });

        return root;
    }

    private mapDataset(organization: Organization, dataset: OpenDataDkDataset) {
        const ds = new Dataset();
        ds["@type"] = "dcat:Dataset";
        ds.accessLevel = "public";

        ds.identifier = this.generateIdentifier(dataset);
        ds.license = dataset.license;
        ds.landingPage = undefined;
        ds.title = dataset.name;
        ds.description = dataset.description;
        ds.keyword = dataset.keywords;
        ds.issued = dataset.createdAt;
        ds.modified = dataset.updatedAt;
        ds.publisher = {
            name: organization.name,
        };
        ds.contactPoint = new ContactPoint();
        ds.contactPoint["@type"] = "vcard:Contact";
        ds.contactPoint.fn = dataset.authorName;
        ds.contactPoint.hasEmail = `mailto:${dataset.authorEmail}`;

        ds.distribution = [this.mapDistribution(dataset)];

        return ds;
    }

    private mapDistribution(dataset: OpenDataDkDataset) {
        const distribution = new Distribution();
        distribution["@type"] = "dcat:Distribution";
        distribution.mediaType = "application/json";
        distribution.format = "JSON";

        distribution.accessURL = this.generateAccessUrl(dataset);
        distribution.title = dataset.resourceTitle;
        return distribution;
    }

    private generateIdentifier(dataset: OpenDataDkDataset): string {
        return `test${dataset.id}`;
    }

    private generateAccessUrl(dataset: OpenDataDkDataset): string {
        return `https://test.dk/blabla${dataset.id}`;
    }
}
