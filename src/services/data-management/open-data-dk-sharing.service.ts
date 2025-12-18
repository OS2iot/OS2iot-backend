import { PATH_METADATA } from "@nestjs/common/constants";
import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { ContactPoint, Dataset, DCATRootObject, Distribution } from "@dto/open-data-dk-dcat.dto";
import { OpenDataDkDataset } from "@entities/open-data-dk-dataset.entity";
import { Organization } from "@entities/organization.entity";
import { PayloadDecoderExecutorService } from "./payload-decoder-executor.service";
import { IoTDevicePayloadDecoderDataTargetConnection } from "@entities/iot-device-payload-decoder-data-target-connection.entity";
import { IoTDevice } from "@entities/iot-device.entity";
import configuration from "@config/configuration";
import { OpenDataDkSharingController } from "@admin-controller/open-data-dk-sharing.controller";
import { ErrorCodes } from "@enum/error-codes.enum";
import { IoTDeviceType } from "@enum/device-type.enum";
import { ChirpstackDeviceService } from "@services/chirpstack/chirpstack-device.service";

@Injectable()
export class OpenDataDkSharingService {
  private readonly BACKEND_BASE_URL = configuration()["backend"]["baseurl"];
  private readonly logger = new Logger(OpenDataDkSharingService.name);

  constructor(
    @InjectRepository(OpenDataDkDataset)
    private repository: Repository<OpenDataDkDataset>,
    private payloadDecoderExecutorService: PayloadDecoderExecutorService,
    private chirpstackDeviceService: ChirpstackDeviceService
  ) {}

  async getDecodedDataInDataset(dataset: OpenDataDkDataset): Promise<any[] | { error: ErrorCodes }> {
    const rawData = await this.repository
      .createQueryBuilder("dataset")
      .innerJoinAndSelect("dataset.dataTarget", "dt")
      .innerJoinAndSelect("dt.connections", "connections")
      .innerJoinAndSelect("connections.iotDevices", "devices")
      .leftJoinAndSelect("devices.deviceModel", "dm")
      .leftJoinAndSelect("connections.payloadDecoder", "pd")
      .innerJoinAndSelect("devices.latestReceivedMessage", "msg")
      .where("dataset.id = :id", { id: dataset.id })
      .getOne();

    if (!rawData) {
      return { error: ErrorCodes.NoData };
    }

    return await this.decodeData(rawData);
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

  async getAllOpenDataDkSharesForOrganization(organization: Organization): Promise<OpenDataDkDataset[]> {
    return this.findDatasetWithRelations().where("org.id = :orgId", { orgId: organization.id }).getMany();
  }

  private async decodeData(rawData: OpenDataDkDataset) {
    const results: any[] = [];
    for (const connection of rawData.dataTarget.connections) {
      this.logger.debug(`Got connection(${connection.id})`);
      for (const device of connection.iotDevices) {
        await this.decodeDevice(device, connection, results);
      }
    }
    return results;
  }

  private async decodeDevice(
    device: IoTDevice,
    connection: IoTDevicePayloadDecoderDataTargetConnection,
    results: any[]
  ) {
    this.logger.debug(`Doing device ${device.name} / ${device.id}`);
    if (!device.latestReceivedMessage) {
      this.logger.debug(`Device ${device.name} / ${device.id} has no data ... skipping`);
      return;
    }
    try {
      if (connection.payloadDecoder != null) {
        // Enrich lorawan devices with chirpstack data
        if (
          device.type === IoTDeviceType.LoRaWAN &&
          connection.payloadDecoder.decodingFunction.includes("lorawanSettings")
        ) {
          device = await this.chirpstackDeviceService.enrichLoRaWANDevice(device);
        }

        const decoded = await this.payloadDecoderExecutorService.callUntrustedCode(
          connection.payloadDecoder.decodingFunction,
          device,
          device.latestReceivedMessage.rawData
        );
        results.push(JSON.parse(decoded));
      } else {
        results.push(device.latestReceivedMessage.rawData);
      }
    } catch (err) {
      this.logger.error(
        `Got error during decode of device(${device.id}) with decoder(${connection.payloadDecoder.id}): ${err}`
      );
      results.push({
        error: `Could not decode data for device(${device.id})`,
      });
    }
  }

  private findDatasetWithRelations() {
    return this.repository
      .createQueryBuilder("dataset")
      .innerJoin("dataset.dataTarget", "dt")
      .innerJoin("dt.application", "app")
      .innerJoin("app.belongsTo", "org");
  }

  private mapToDCAT(organization: Organization, datasets: OpenDataDkDataset[]): DCATRootObject {
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

    ds.identifier = this.generateUrl(organization, dataset);
    ds.landingPage = undefined;
    ds.title = dataset.name;
    ds.description = dataset.description;
    ds.theme = dataset.keywords != null ? dataset.keywords : [];
    ds.keyword = dataset.keywordTags != null ? dataset.keywordTags.split(",") : [];
    ds.issued = dataset.createdAt;
    ds.modified = dataset.updatedAt;
    ds.publisher = {
      name: organization.name,
    };
    ds.contactPoint = new ContactPoint();
    ds.contactPoint["@type"] = "vcard:Contact";
    ds.contactPoint.fn = dataset.authorName;
    ds.contactPoint.hasEmail = `mailto:${dataset.authorEmail}`;
    ds.documentation =
      !dataset.documentationUrl || dataset.documentationUrl?.startsWith("https://")
        ? dataset.documentationUrl
        : `https://${dataset.documentationUrl}`;
    ds.update_frequency = dataset.updateFrequency;
    ds.data_directory = dataset.dataDirectory;

    ds.distribution = [this.mapDistribution(organization, dataset)];

    return ds;
  }

  private mapDistribution(organization: Organization, dataset: OpenDataDkDataset) {
    const distribution = new Distribution();
    distribution["@type"] = "dcat:Distribution";
    distribution.mediaType = "application/json";
    distribution.format = "JSON";
    distribution.license = dataset.license;

    distribution.accessURL = this.generateUrl(organization, dataset);
    distribution.title = dataset.resourceTitle;
    return distribution;
  }

  private generateUrl(organization: Organization, dataset: OpenDataDkDataset): string {
    const controllerUrl = Reflect.getMetadata(PATH_METADATA, OpenDataDkSharingController);
    const organizationId = organization.id;
    return `${this.BACKEND_BASE_URL}/api/v1/${controllerUrl}/${organizationId}/data/${dataset.id}`;
  }
}
