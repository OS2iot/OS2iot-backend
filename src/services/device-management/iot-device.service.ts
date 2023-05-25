import { DeviceDownlinkQueueResponseDto } from "@dto/chirpstack/chirpstack-device-downlink-queue-response.dto";
import { ChirpstackDeviceId } from "@dto/chirpstack/chirpstack-device-id.dto";
import { DeviceStatsResponseDto } from "@dto/chirpstack/device/device-stats.response.dto";
import { ListAllChirpstackApplicationsResponseDto } from "@dto/chirpstack/list-all-applications-response.dto";
import { CreateIoTDeviceDto } from "@dto/create-iot-device.dto";
import { CreateSigFoxSettingsDto } from "@dto/create-sigfox-settings.dto";
import { AuthenticatedRequest } from "@dto/internal/authenticated-request";
import { CreateIoTDeviceMapDto } from "@dto/iot-device/create-iot-device-map.dto";
import { IotDeviceBatchResponseDto } from "@dto/iot-device/iot-device-batch-response.dto";
import { UpdateIoTDeviceBatchDto } from "@dto/iot-device/update-iot-device-batch.dto";
import {
    IoTDeviceMinimal,
    IoTDeviceMinimalRaw,
    ListAllIoTDevicesMinimalResponseDto,
} from "@dto/list-all-iot-devices-minimal-response.dto";
import { LoRaWANDeviceWithChirpstackDataDto } from "@dto/lorawan-device-with-chirpstack-data.dto";
import { SigFoxDeviceWithBackendDataDto } from "@dto/sigfox-device-with-backend-data.dto";
import { CreateSigFoxApiDeviceRequestDto } from "@dto/sigfox/external/create-sigfox-api-device-request.dto";
import {
    SigFoxApiDeviceContent,
    SigFoxApiDeviceResponse,
} from "@dto/sigfox/external/sigfox-api-device-response.dto";
import { UpdateSigFoxApiDeviceRequestDto } from "@dto/sigfox/external/update-sigfox-api-device-request.dto";
import { UpdateIoTDeviceDto } from "@dto/update-iot-device.dto";
import { Application } from "@entities/application.entity";
import { DeviceModel } from "@entities/device-model.entity";
import { ErrorCodes } from "@entities/enum/error-codes.enum";
import { GenericHTTPDevice } from "@entities/generic-http-device.entity";
import { IoTDevice } from "@entities/iot-device.entity";
import { LoRaWANDevice } from "@entities/lorawan-device.entity";
import { Multicast } from "@entities/multicast.entity";
import { SigFoxDevice } from "@entities/sigfox-device.entity";
import { SigFoxGroup } from "@entities/sigfox-group.entity";
import { iotDeviceTypeMap } from "@enum/device-type-mapping";
import { IoTDeviceType } from "@enum/device-type.enum";
import { ActivationType } from "@enum/lorawan-activation-type.enum";
import { subtractDays } from "@helpers/date.helper";
import {
    filterValidIotDeviceMaps,
    isValidIoTDeviceMap,
    mapAllDevicesByProcessed,
    validateMQTTInternalBroker,
    validateMQTTExternalBroker,
} from "@helpers/iot-device.helper";
import {
    BadRequestException,
    Injectable,
    InternalServerErrorException,
    Logger,
    NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ChirpstackDeviceService } from "@services/chirpstack/chirpstack-device.service";
import { ApplicationService } from "@services/device-management/application.service";
import { SigFoxApiDeviceTypeService } from "@services/sigfox/sigfox-api-device-type.service";
import { SigFoxApiDeviceService } from "@services/sigfox/sigfox-api-device.service";
import { SigFoxGroupService } from "@services/sigfox/sigfox-group.service";
import { SigFoxMessagesService } from "@services/sigfox/sigfox-messages.service";
import {
    DeleteResult,
    EntityManager,
    ILike,
    In,
    Repository,
    SelectQueryBuilder,
} from "typeorm";
import { v4 as uuidv4 } from "uuid";
import { DeviceModelService } from "./device-model.service";
import { IoTLoRaWANDeviceService } from "./iot-lorawan-device.service";
import { MQTTInternalBrokerDevice } from "@entities/mqtt-internal-broker-device.entity";
import { MqttService } from "@services/mqtt/mqtt.service";
import { MQTTInternalBrokerDeviceDTO } from "@dto/mqtt-internal-broker-device.dto";
import { AuthenticationType } from "@enum/authentication-type.enum";
import { MQTTPermissionLevel } from "@enum/mqtt-permission-level.enum";
import { MQTTExternalBrokerDeviceDTO } from "@dto/mqtt-external-broker-device.dto";
import { MQTTExternalBrokerDevice } from "@entities/mqtt-external-broker-device.entity";
import { InternalMqttClientListenerService } from "@services/data-management/internal-mqtt-client-listener.service";
import { EncryptionHelperService } from "@services/encryption-helper.service";
import { CsvGeneratorService } from "@services/csv-generator.service";
import * as fs from "fs";
import { caCertPath } from "@resources/resource-paths";

type IoTDeviceOrSpecialized =
    | IoTDevice
    | LoRaWANDeviceWithChirpstackDataDto
    | SigFoxDeviceWithBackendDataDto
    | MQTTInternalBrokerDeviceDTO;

@Injectable()
export class IoTDeviceService {
    constructor(
        @InjectRepository(GenericHTTPDevice)
        private genericHTTPDeviceRepository: Repository<GenericHTTPDevice>,
        @InjectRepository(SigFoxDevice)
        private sigfoxRepository: Repository<SigFoxDevice>,
        @InjectRepository(IoTDevice)
        private iotDeviceRepository: Repository<IoTDevice>,
        @InjectRepository(LoRaWANDevice)
        private loRaWANDeviceRepository: Repository<LoRaWANDevice>,
        @InjectRepository(MQTTInternalBrokerDevice)
        private mqttInternalBrokerDeviceRepository: Repository<MQTTInternalBrokerDevice>,
        @InjectRepository(MQTTExternalBrokerDevice)
        private mqttExternalBrokerDeviceRepository: Repository<MQTTExternalBrokerDevice>,
        private entityManager: EntityManager,
        private applicationService: ApplicationService,
        private chirpstackDeviceService: ChirpstackDeviceService,
        private sigfoxApiDeviceService: SigFoxApiDeviceService,
        private sigfoxApiDeviceTypeService: SigFoxApiDeviceTypeService,
        private sigfoxGroupService: SigFoxGroupService,
        private deviceModelService: DeviceModelService,
        private ioTLoRaWANDeviceService: IoTLoRaWANDeviceService,
        private sigfoxMessagesService: SigFoxMessagesService,
        private mqttService: MqttService,
        private internalMqttClientListenerService: InternalMqttClientListenerService,
        private encryptionHelperService: EncryptionHelperService,
        private csvGeneratorService: CsvGeneratorService
    ) {}

    private readonly logger = new Logger(IoTDeviceService.name);

    async findOne(id: number): Promise<IoTDevice> {
        return await this.iotDeviceRepository.findOneOrFail({
            where: { id },
            relations: ["application"],
        });
    }

    async findAllSigFoxDevices(): Promise<SigFoxDevice[]> {
        return await this.sigfoxRepository.find();
    }

    async findManyByIds(iotDeviceIds: number[]): Promise<IoTDevice[]> {
        if (iotDeviceIds == null || iotDeviceIds?.length == 0) {
            return [];
        }
        return await this.iotDeviceRepository.find({
            where: { id: In(iotDeviceIds) },
            relations: ["application"],
        });
    }

    async findOneWithApplicationAndMetadata(
        id: number,
        enrich?: boolean
    ): Promise<IoTDeviceOrSpecialized> {
        // Repository syntax doesn't yet support ordering by relation: https://github.com/typeorm/typeorm/issues/2620
        // Therefore we use the QueryBuilder ...
        const iotDevice = await this.queryDatabaseForIoTDevice(id);

        if (iotDevice == null) {
            throw new NotFoundException();
        }
        if (enrich) {
            if (iotDevice.type == IoTDeviceType.LoRaWAN) {
                // Add more suplimental info about LoRaWAN devices.
                return await this.chirpstackDeviceService.enrichLoRaWANDevice(iotDevice);
            } else if (iotDevice.type == IoTDeviceType.SigFox) {
                // Add more info about SigFox devices
                return await this.enrichSigFoxDevice(iotDevice);
            } else if (iotDevice.type === IoTDeviceType.MQTTInternalBroker) {
                return await this.enrichMQTTInternalBrokerDevice(iotDevice);
            } else if (iotDevice.type === IoTDeviceType.MQTTExternalBroker) {
                return await this.enrichMQTTExternalBrokerDevice(iotDevice);
            }
        }

        return iotDevice;
    }

    async findManyWithApplicationAndMetadata(
        ids: number[]
    ): Promise<IoTDeviceOrSpecialized[]> {
        return this.queryDatabaseForIoTDevices(ids);
    }

    async enrichSigFoxDevice(
        iotDevice: IoTDevice
    ): Promise<SigFoxDeviceWithBackendDataDto> {
        const sigfoxDevice = iotDevice as SigFoxDeviceWithBackendDataDto;

        const application = await this.applicationService.findOneWithOrganisation(
            iotDevice.application.id
        );

        const sigfoxGroup = await this.sigfoxGroupService.findOneByGroupId(
            sigfoxDevice.groupId,
            application.belongsTo.id
        );

        const thisDevice = await this.getDataFromSigFoxAboutDevice(
            sigfoxGroup,
            sigfoxDevice
        );
        if (!thisDevice) {
            throw new NotFoundException(ErrorCodes.SigfoxError);
        }
        sigfoxDevice.sigfoxSettings = await this.mapSigFoxBackendDataToDto(
            thisDevice,
            sigfoxGroup
        );

        return sigfoxDevice;
    }

    async mapSigFoxBackendDataToDto(
        thisDevice: SigFoxApiDeviceContent,
        sigfoxGroup: SigFoxGroup
    ): Promise<CreateSigFoxSettingsDto> {
        return {
            deviceId: thisDevice.id,
            deviceTypeId: thisDevice.deviceType.id,
            deviceTypeName: thisDevice.deviceType.name,
            groupId: sigfoxGroup.id,
            groupName: thisDevice.group.name,
            connectToExistingDeviceInBackend: true,
            pac: thisDevice.pac,
            endProductCertificate: thisDevice.productCertificate.key,
            prototype: thisDevice.prototype,
        };
    }

    async findAllByPayloadDecoder(
        req: AuthenticatedRequest,
        payloadDecoderId: number,
        limit: number,
        offset: number
    ): Promise<ListAllIoTDevicesMinimalResponseDto> {
        const data: Promise<
            IoTDeviceMinimalRaw[]
        > = this.getQueryForFindAllByPayloadDecoder(payloadDecoderId)
            .addSelect('"application"."id"', "applicationId")
            .addSelect('"application"."belongsToId"', "organizationId")
            .limit(limit)
            .offset(offset)
            .getRawMany();

        const count = this.getQueryForFindAllByPayloadDecoder(
            payloadDecoderId
        ).getCount();

        const transformedData: IoTDeviceMinimal[] = await this.mapToIoTDeviceMinimal(
            data,
            req
        );

        return {
            data: transformedData,
            count: await count,
        };
    }

    private async mapToIoTDeviceMinimal(
        data: Promise<IoTDeviceMinimalRaw[]>,
        req: AuthenticatedRequest
    ): Promise<IoTDeviceMinimal[]> {
        const applications = req.user.permissions.getAllApplicationsWithAtLeastRead();
        const organizations = req.user.permissions.getAllOrganizationsWithApplicationAdmin();
        return (await data).map(x => {
            return {
                id: x.id,
                name: x.name,
                lastActiveTime: x.sentTime != null ? x.sentTime : null,
                organizationId: x.organizationId,
                applicationId: x.applicationId,
                canRead: this.hasAccessToIoTDevice(x, applications, organizations, req),
            };
        });
    }

    private hasAccessToIoTDevice(
        x: IoTDeviceMinimalRaw,
        apps: number[],
        orgs: number[],
        req: AuthenticatedRequest
    ): boolean {
        if (req.user.permissions.isGlobalAdmin) {
            return true;
        } else if (orgs.some(orgId => orgId == x.organizationId)) {
            return true;
        } else if (apps.some(appId => appId == x.applicationId)) {
            return true;
        }
        return false;
    }

    private getQueryForFindAllByPayloadDecoder(
        payloadDecoderId: number
    ): SelectQueryBuilder<IoTDevice> {
        return this.iotDeviceRepository
            .createQueryBuilder("device")
            .innerJoin("device.application", "application")
            .innerJoin("device.connections", "connection")
            .leftJoin("device.latestReceivedMessage", "receivedMessage")
            .where('"connection"."payloadDecoderId" = :id', { id: payloadDecoderId })
            .orderBy("device.id")
            .select(['"device"."id"', '"device"."name"', '"receivedMessage"."sentTime"']);
    }

    /**
     * Avoid calling the endpoint /devices/:id at SigFox
     * https://support.sigfox.com/docs/api-rate-limiting
     */
    private async getDataFromSigFoxAboutDevice(
        sigfoxGroup: SigFoxGroup,
        sigfoxDevice: SigFoxDeviceWithBackendDataDto
    ) {
        const allDevices = await this.sigfoxApiDeviceService.getAllByGroupIds(
            sigfoxGroup,
            [sigfoxDevice.groupId]
        );

        const thisDevice = allDevices.data.find(x => x.id == sigfoxDevice.deviceId);
        return thisDevice;
    }

    private buildIoTDeviceWithRelationsQuery(): SelectQueryBuilder<IoTDevice> {
        return this.iotDeviceRepository
            .createQueryBuilder("iot_device")
            .loadAllRelationIds({ relations: ["createdBy", "updatedBy"] })
            .innerJoinAndSelect(
                "iot_device.application",
                "application",
                'application.id = iot_device."applicationId"'
            )
            .leftJoinAndSelect(
                "iot_device.receivedMessagesMetadata",
                "metadata",
                'metadata."deviceId" = iot_device.id'
            )
            .leftJoinAndSelect(
                "iot_device.latestReceivedMessage",
                "receivedMessage",
                '"receivedMessage"."deviceId" = iot_device.id'
            )
            .leftJoinAndSelect(
                "iot_device.deviceModel",
                "device_model",
                'device_model.id = iot_device."deviceModelId"'
            )
            .orderBy('metadata."sentTime"', "DESC");
    }

    private async queryDatabaseForIoTDevice(id: number) {
        return await this.buildIoTDeviceWithRelationsQuery()
            .where("iot_device.id = :id", { id: id })
            .getOne();
    }

    private queryDatabaseForIoTDevices(ids: number[]) {
        return this.buildIoTDeviceWithRelationsQuery()
            .where("iot_device.id IN (:...ids)", { ids })
            .getMany();
    }

    async findGenericHttpDeviceByApiKey(key: string): Promise<GenericHTTPDevice> {
        return await this.genericHTTPDeviceRepository.findOneBy({ apiKey: key });
    }

    async findSigFoxDeviceByDeviceIdAndDeviceTypeId(
        deviceId: string,
        apiKey: string
    ): Promise<SigFoxDevice> {
        return await this.sigfoxRepository.findOneBy({
            deviceId,
            deviceTypeId: apiKey,
        });
    }

    async findLoRaWANDeviceByDeviceEUI(deviceEUI: string): Promise<LoRaWANDevice> {
        return await this.loRaWANDeviceRepository.findOneBy({
            deviceEUI: ILike(deviceEUI),
        });
    }

    async findMQTTDevice(id: number): Promise<MQTTInternalBrokerDevice> {
        return await this.mqttInternalBrokerDeviceRepository.findOne({
            where: { id },
        });
    }

    async getMqttSuperUser(): Promise<MQTTInternalBrokerDevice> {
        return await this.mqttInternalBrokerDeviceRepository.findOne({
            where: { permissions: MQTTPermissionLevel.superUser },
        });
    }

    async getAllValidMQTTExternalBrokers(): Promise<MQTTExternalBrokerDevice[]> {
        return await this.mqttExternalBrokerDeviceRepository.find({
            where: { type: IoTDeviceType.MQTTExternalBroker, invalidMqttConfig: false },
        });
    }

    async create(
        createIoTDeviceDto: CreateIoTDeviceDto,
        userId: number
    ): Promise<IoTDevice> {
        // Reuse the same logic for creating multiple devices.
        const iotDevice = await this.createMany([createIoTDeviceDto], userId);

        // We passed in 1 device, so we expect the output to contain 1 device as well
        if (iotDevice[0].error) throw new BadRequestException(iotDevice[0].error);
        return iotDevice[0].data;
    }

    async createMany(
        createIoTDeviceDtos: CreateIoTDeviceDto[],
        userId: number
    ): Promise<IotDeviceBatchResponseDto[]> {
        const iotDevicesMaps: CreateIoTDeviceMapDto[] = [];

        // Translate each generic device to the specific type
        createIoTDeviceDtos.forEach(createIotDevice => {
            try {
                const deviceType = iotDeviceTypeMap[createIotDevice.type];
                const iotDevice = new deviceType();
                iotDevicesMaps.push({ iotDeviceDto: createIotDevice, iotDevice });
            } catch (error) {
                iotDevicesMaps.push({ iotDeviceDto: createIotDevice, error });
            }
        });

        await this.validateDtoAndCreateIoTDevice(
            // Don't process any devices whose type couldn't be determined
            filterValidIotDeviceMaps(iotDevicesMaps),
            false
        );
        // Filter any device which failed validation or couldn't be created
        const validProcessedDevices = filterValidIotDeviceMaps(iotDevicesMaps);

        for (const mappedIotDevice of validProcessedDevices) {
            if (mappedIotDevice.iotDevice) {
                mappedIotDevice.iotDevice.createdBy = userId;
                mappedIotDevice.iotDevice.updatedBy = userId;
            }
        }

        // Store or update valid devices on the database
        const validIotDevices = validProcessedDevices.map(
            iotDeviceMap => iotDeviceMap.iotDevice
        );
        const dbIotDevices = validIotDevices.length
            ? await this.iotDeviceRepository.save(validIotDevices)
            : [];

        // Set deviceId related values on new mqtt devices
        await this.handleNewMQTTDevices(dbIotDevices);

        // Return a new list with all processed and failed devices
        return iotDevicesMaps.map(mapAllDevicesByProcessed(dbIotDevices));
    }

    async save(iotDevice: IoTDevice): Promise<IoTDevice> {
        return await this.iotDeviceRepository.save(iotDevice);
    }

    async removeDownlink(sigfoxDevice: SigFoxDevice): Promise<SigFoxDevice> {
        this.logger.log(
            `Removing downlink from device(${sigfoxDevice.id}) sigfoxId(${sigfoxDevice.deviceId})`
        );
        sigfoxDevice.downlinkPayload = null;
        return await this.iotDeviceRepository.save(sigfoxDevice);
    }

    async getDownlinkForSigfox(
        device: SigFoxDevice
    ): Promise<DeviceDownlinkQueueResponseDto> {
        if (device.downlinkPayload != null) {
            return {
                totalCount: 1,
                deviceQueueItems: [
                    {
                        data: device.downlinkPayload,
                    },
                ],
            };
        }
        return {
            totalCount: 0,
            deviceQueueItems: [],
        };
    }

    async update(
        id: number,
        updateDto: UpdateIoTDeviceDto,
        userId: number
    ): Promise<IoTDevice> {
        const existingIoTDevice = await this.iotDeviceRepository.findOneByOrFail({ id });
        const iotDeviceDtoMap: CreateIoTDeviceMapDto[] = [
            { iotDevice: existingIoTDevice, iotDeviceDto: updateDto },
        ];
        await this.validateDtoAndCreateIoTDevice(iotDeviceDtoMap, true);

        const mappedIoTDevice = iotDeviceDtoMap[0].iotDevice;
        mappedIoTDevice.updatedBy = userId;
        const res = this.iotDeviceRepository.save(mappedIoTDevice);

        return res;
    }

    async updateMany(
        updateDto: UpdateIoTDeviceBatchDto,
        userId: number
    ): Promise<IotDeviceBatchResponseDto[]> {
        // Fetch existing devices from db and map them
        const existingDevices = await this.iotDeviceRepository.findBy({
            id: In(updateDto.data.map(device => device.id)),
        });
        const iotDeviceMaps: CreateIoTDeviceMapDto[] = updateDto.data.map(
            updateDevice => ({
                iotDeviceDto: updateDevice,
                iotDevice: existingDevices.find(
                    existingDevice => existingDevice.id === updateDevice.id
                ),
            })
        );
        await this.validateDtoAndCreateIoTDevice(iotDeviceMaps, true);

        const validDevices = iotDeviceMaps.reduce((res: IoTDevice[], currentMap) => {
            if (isValidIoTDeviceMap(currentMap)) {
                currentMap.iotDevice.updatedBy = userId;
                res.push(currentMap.iotDevice);
            }

            return res;
        }, []);
        const dbIotDevices = await this.iotDeviceRepository.save(validDevices);

        // Return a new list with all processed and failed devices
        return iotDeviceMaps.map(mapAllDevicesByProcessed(dbIotDevices));
    }

    async delete(device: IoTDevice): Promise<DeleteResult> {
        let deleteResult: DeleteResult = {
            raw: null,
            affected: 0,
        };

        // Run these operations inside a TypeORM transaction to make sure if operations on chirpstack fail, we
        // roll back any changes on the database to ensure consistency between devices in the OS2iot database
        // and the Chirpstack database.
        await this.entityManager.transaction(async transactionManager => {
            // Find and delete m-n relations with the device first
            await this.deleteMulticastsFromDevice(transactionManager, device);
            const iotDeviceRepository = transactionManager.getRepository(IoTDevice);

            // Remove all data target connections before deleting the device. We can't do the same thing
            // with multicasts as the relation isn't on the IoT device entity (bug)
            device.connections = [];
            await iotDeviceRepository.save(device);
            deleteResult = await transactionManager.delete(IoTDevice, device.id);

            // Now we can safely perform any actions against Chirpstack
            if (device.type == IoTDeviceType.LoRaWAN) {
                const lorawanDevice = device as LoRaWANDevice;
                this.logger.debug(
                    `Deleting LoRaWANDevice ${lorawanDevice.id} / ${lorawanDevice.deviceEUI} in Chirpstack ...`
                );

                await this.chirpstackDeviceService.deleteDevice(lorawanDevice.deviceEUI);
            } else if (device.type === IoTDeviceType.MQTTExternalBroker) {
                this.internalMqttClientListenerService.removeMQTTClient(
                    device as MQTTExternalBrokerDevice
                );
            }
        });

        return deleteResult;
    }

    async markMqttExternalBrokerAsInvalid(device: MQTTExternalBrokerDevice) {
        device.invalidMqttConfig = true;
        await this.mqttExternalBrokerDeviceRepository.save(device);
    }

    private async deleteMulticastsFromDevice(manager: EntityManager, device: IoTDevice) {
        const multicastRepository = manager.getRepository(Multicast);
        // Take only the multicasts with references to the device.
        // Filtering by device id won't return multicasts with all devices
        const _multicasts = await multicastRepository
            .createQueryBuilder("multicast")
            .innerJoinAndSelect("multicast.iotDevices", "iot_device")
            .getMany();

        // Filter multicasts without the device out to avoid updating them
        const multicastsWithDevice = _multicasts.filter(multicast =>
            multicast.iotDevices.some(iotDevice => iotDevice.id === device.id)
        );
        // Remove device from the mappings. It's important that each existing mapping has been fetched
        // as the new mappings will replace the existing ones.
        multicastsWithDevice.forEach(
            multicast =>
                (multicast.iotDevices = multicast.iotDevices?.filter(
                    iotDevice => iotDevice.id !== device.id
                ))
        );
        await multicastRepository.save(multicastsWithDevice);
    }

    async deleteMany(ids: number[]): Promise<DeleteResult> {
        return this.iotDeviceRepository.delete(ids);
    }

    async findStats(device: IoTDevice): Promise<DeviceStatsResponseDto[]> {
        const toDate = new Date();
        const fromDate = subtractDays(toDate, 30);

        switch (device.type) {
            case IoTDeviceType.LoRaWAN:
                const loraData = await this.chirpstackDeviceService.getStats(
                    (device as LoRaWANDevice).deviceEUI
                );

                return loraData.result.map(loraStat => ({
                    timestamp: loraStat.timestamp,
                    rssi: loraStat.gwRssi,
                    snr: loraStat.gwSnr,
                    rxPacketsPerDr: loraStat.rxPacketsPerDr,
                }));
            case IoTDeviceType.SigFox:
                const sigFoxData = await this.sigfoxMessagesService.getMessageSignals(
                    device.id,
                    fromDate,
                    toDate
                );

                // SigFox data might contain data points on the same day. They have to be averaged
                const sortedStats = sigFoxData
                    .map(data => ({
                        timestamp: data.sentTime.toISOString(),
                        rssi: data.rssi,
                        snr: data.snr,
                    }))
                    .sort(
                        (a, b) =>
                            new Date(a.timestamp).getTime() -
                            new Date(b.timestamp).getTime()
                    );
                const averagedStats = this.averageStatsForSameDay(sortedStats);
                return averagedStats;
            default:
                return null;
        }
    }

    private averageStatsForSameDay(stats: DeviceStatsResponseDto[]) {
        const statsSummed = stats.reduce(
            (
                res: Record<
                    string,
                    { timestamp: string; count: number; rssi: number; snr: number }
                >,
                item
            ) => {
                // Assume that the date is ISO formatted and extract only the date.
                const dateWithoutTime = item.timestamp.split("T")[0];
                res[dateWithoutTime] = res.hasOwnProperty(dateWithoutTime)
                    ? {
                          count: res[dateWithoutTime].count + 1,
                          timestamp: item.timestamp,
                          rssi: res[dateWithoutTime].rssi + item.rssi,
                          snr: res[dateWithoutTime].snr + item.snr,
                      }
                    : {
                          count: 1,
                          timestamp: item.timestamp,
                          rssi: item.rssi,
                          snr: item.snr,
                      };
                return res;
            },
            {}
        );

        const averagedStats: DeviceStatsResponseDto[] = Object.entries(statsSummed).map(
            ([_key, item]) => ({
                timestamp: item.timestamp,
                rssi: item.rssi / item.count,
                snr: item.snr / item.count,
            })
        );

        return averagedStats;
    }

    /**
     * Validate and map info. from the dto onto an IoT device. This device is then created or updated
     * as one of the final steps. I.e. valid chirpstack devices will be created in Chirpstack
     * @param iotDeviceMaps
     * @param isUpdate
     */
    private async validateDtoAndCreateIoTDevice(
        iotDeviceMaps: CreateIoTDeviceMapDto[],
        isUpdate: boolean
    ): Promise<void> {
        const applicationIds = iotDeviceMaps.reduce((res: number[], { iotDeviceDto }) => {
            if (iotDeviceDto.applicationId) {
                res.push(iotDeviceDto.applicationId);
            }

            return res;
        }, []);
        // Pre-fetch applications
        const applications = await this.getApplicationsByIds(applicationIds);

        // Populate all IoT devices. Any which fail will be added to the response as failed devices
        for (const map of iotDeviceMaps) {
            const { iotDevice, iotDeviceDto } = map;
            try {
                const application = applications.find(
                    app => app.id === iotDeviceDto.applicationId
                );
                iotDevice.name = iotDeviceDto.name;
                iotDevice.application = application;

                if (iotDeviceDto.longitude != null && iotDeviceDto.latitude != null) {
                    iotDevice.location = {
                        type: "Point",
                        coordinates: [iotDeviceDto.longitude, iotDeviceDto.latitude],
                    };
                } else {
                    iotDevice.location = null;
                }

                iotDevice.comment = iotDeviceDto.comment;
                iotDevice.commentOnLocation = iotDeviceDto.commentOnLocation;
                iotDevice.metadata = iotDeviceDto.metadata;
            } catch (error) {
                map.error = error;
            }
        }

        // Set and validate properties on each IoT device
        // Filter devices whose properties couldn't be set
        await this.mapDeviceModels(filterValidIotDeviceMaps(iotDeviceMaps));
        // Filter devices which didn't have a valid device model
        await this.mapChildDtoToIoTDevice(
            filterValidIotDeviceMaps(iotDeviceMaps),
            isUpdate
        );
    }

    async mapDeviceModels(iotDevicesDtoMap: CreateIoTDeviceMapDto[]): Promise<void> {
        // Pre-fetch device models
        const deviceModelIds = iotDevicesDtoMap.reduce((ids: number[], dto) => {
            if (dto.iotDeviceDto.deviceModelId) {
                ids.push(dto.iotDeviceDto.deviceModelId);
            }

            return ids;
        }, []);

        const deviceModels = await this.deviceModelService.getByIdsWithRelations(
            deviceModelIds
        );

        const applicationIds = iotDevicesDtoMap.reduce((ids: number[], dto) => {
            if (dto.iotDeviceDto.applicationId) {
                ids.push(dto.iotDeviceDto.applicationId);
            }
            return ids;
        }, []);

        const applications = await this.applicationService.findManyWithOrganisation(
            applicationIds
        );

        // Ensure that each device model is assignable
        this.setDeviceModel(iotDevicesDtoMap, applications, deviceModels);
    }

    private setDeviceModel(
        iotDevicesDtoMap: CreateIoTDeviceMapDto[],
        applications: Application[],
        deviceModels: DeviceModel[]
    ) {
        for (const map of iotDevicesDtoMap) {
            const applicationMatch = applications.find(
                application => application.id === map.iotDevice.application.id
            );

            if (!applicationMatch) {
                map.error = {
                    message: ErrorCodes.ApplicationDoesNotExist,
                };
                continue;
            }

            // Validate DeviceModel if set
            if (map.iotDeviceDto.deviceModelId) {
                const deviceModelMatch = deviceModels.find(
                    model => model.id === map.iotDeviceDto.deviceModelId
                );

                if (!deviceModelMatch) {
                    map.error = { message: ErrorCodes.DeviceModelDoesNotExist };
                    continue;
                }

                if (deviceModelMatch.belongsTo.id !== applicationMatch.belongsTo.id) {
                    map.error = {
                        message: ErrorCodes.DeviceModelOrganizationDoesNotMatch,
                    };
                    continue;
                }

                map.iotDevice.deviceModel = deviceModelMatch;
            }
        }
    }

    resetHttpDeviceApiKey(
        httpDevice: GenericHTTPDevice
    ): Promise<GenericHTTPDevice & IoTDevice> {
        httpDevice.apiKey = uuidv4();
        return this.iotDeviceRepository.save(httpDevice);
    }

    private async getApplicationsByIds(applicationIds: number[]) {
        return applicationIds.length
            ? await this.applicationService.findManyByIds(applicationIds)
            : [];
    }

    private async mapChildDtoToIoTDevice(
        iotDevicesDtoMap: CreateIoTDeviceMapDto[],
        isUpdate: boolean
    ): Promise<void> {
        // Pre-fetch lorawan settings, if any
        const loraDeviceEuis = await this.getLorawanDeviceEuis(iotDevicesDtoMap);
        const loraOrganizationId = await this.chirpstackDeviceService.getDefaultOrganizationId();
        const loraApplications = await this.chirpstackDeviceService.getAllApplicationsWithPagination(
            loraOrganizationId
        );

        // Populate each IoT device with the specific device type metadata
        for (const map of iotDevicesDtoMap) {
            try {
                if (map.iotDevice.constructor.name === LoRaWANDevice.name) {
                    const cast = map.iotDevice as LoRaWANDevice;
                    map.iotDevice = await this.mapLoRaWANDevice(
                        map.iotDeviceDto,
                        cast,
                        isUpdate,
                        loraDeviceEuis,
                        loraApplications
                    );
                } else if (map.iotDevice.constructor.name === SigFoxDevice.name) {
                    const cast = map.iotDevice as SigFoxDevice;
                    map.iotDevice = await this.mapSigFoxDevice(map.iotDeviceDto, cast);
                } else if (
                    map.iotDevice.constructor.name === MQTTInternalBrokerDevice.name
                ) {
                    const cast = map.iotDevice as MQTTInternalBrokerDevice;
                    map.iotDevice = await this.mapMQTTInternalBrokerDevice(
                        map.iotDeviceDto,
                        cast
                    );
                } else if (
                    map.iotDevice.constructor.name === MQTTExternalBrokerDevice.name
                ) {
                    const cast = map.iotDevice as MQTTExternalBrokerDevice;
                    map.iotDevice = await this.mapMQTTExternalBrokerDevice(
                        map.iotDeviceDto,
                        cast,
                        isUpdate
                    );
                }
            } catch (error) {
                map.error = {
                    message:
                        (error as Error)?.message ??
                        ErrorCodes.FailedToCreateOrUpdateIotDevice,
                };
            }
        }
    }

    private async getLorawanDeviceEuis(
        iotDevicesDtoMap: CreateIoTDeviceMapDto[]
    ): Promise<ChirpstackDeviceId[] | null> {
        const iotLorawanDevices = iotDevicesDtoMap.reduce(
            (res: string[], { iotDevice, iotDeviceDto }) => {
                if (
                    iotDevice.constructor.name === LoRaWANDevice.name &&
                    iotDeviceDto.lorawanSettings
                ) {
                    res.push(iotDeviceDto.lorawanSettings.devEUI);
                }

                return res;
            },
            []
        );

        const loraDeviceEuis = !iotLorawanDevices.length
            ? []
            : // Fetch from the database instead of from Chirpstack to free up load
              await this.ioTLoRaWANDeviceService.getDeviceEUIsByIds(iotLorawanDevices);

        return loraDeviceEuis.map(loraDevice => ({ devEUI: loraDevice.deviceEUI }));
    }

    private async mapSigFoxDevice(
        dto: CreateIoTDeviceDto,
        cast: SigFoxDevice
    ): Promise<SigFoxDevice> {
        cast.deviceId = dto?.sigfoxSettings?.deviceId;
        cast.deviceTypeId = dto?.sigfoxSettings?.deviceTypeId;

        const sigfoxGroup = await this.sigfoxGroupService.findOneWithPassword(
            dto.sigfoxSettings.groupId
        );
        cast.groupId = sigfoxGroup.sigfoxGroupId;
        await this.createOrUpdateSigFoxDevice(dto, sigfoxGroup, cast);

        await this.sigfoxApiDeviceTypeService.addOrUpdateCallback(
            sigfoxGroup,
            cast.deviceTypeId
        );

        return cast;
    }

    private async createOrUpdateSigFoxDevice(
        dto: CreateIoTDeviceDto,
        sigfoxGroup: SigFoxGroup,
        cast: SigFoxDevice
    ) {
        if (dto?.sigfoxSettings?.connectToExistingDeviceInBackend == false) {
            // Create device in sigfox backend
            const res = await this.createInSigfoxBackend(dto, sigfoxGroup);
            cast.deviceId = res.id;
        } else {
            // Ensure that the device exists
            try {
                const res = await this.sigfoxApiDeviceService.getByIdSimple(
                    sigfoxGroup,
                    cast.deviceId
                );
                cast.deviceId = res.id;
                cast.deviceTypeId = res.deviceType.id;
                await this.doEditInSigFoxBackend(res, dto, sigfoxGroup, cast);
            } catch (err) {
                if (err?.status == 429) {
                    throw err;
                }
                throw new BadRequestException(
                    ErrorCodes.DeviceDoesNotExistInSigFoxForGroup
                );
            }
        }
    }

    async getAllSigfoxDevicesByGroup(
        group: SigFoxGroup,
        removeExisting: boolean
    ): Promise<SigFoxApiDeviceResponse> {
        const devices = await this.sigfoxApiDeviceService.getAllByGroupIds(group, [
            group.sigfoxGroupId,
        ]);

        if (removeExisting) {
            const sigfoxDeviceIdsInUse = await this.sigfoxRepository.find({
                select: ["deviceId"],
            });
            const filtered = devices.data.filter(x => {
                return !sigfoxDeviceIdsInUse.some(y => y.deviceId == x.id);
            });
            return {
                data: filtered,
            };
        }

        return devices;
    }

    async getDevicesMetadataCsv(applicationId: number) {
        const iotDevices = await this.iotDeviceRepository
            .createQueryBuilder("device")
            .where("device.applicationId = :applicationId", { applicationId })
            .getMany();

        for (const d of iotDevices) {
            if (d.type !== IoTDeviceType.LoRaWAN) {
                continue;
            }
            await this.chirpstackDeviceService.enrichLoRaWANDevice(d);
        }

        const csvString = this.csvGeneratorService.generateDeviceMetadataCsv(iotDevices);
        return Buffer.from(csvString);
    }

    private async doEditInSigFoxBackend(
        currentSigFoxSettings: SigFoxApiDeviceContent,
        dto: CreateIoTDeviceDto,
        sigfoxGroup: SigFoxGroup,
        sigfoxDevice: SigFoxDevice
    ) {
        await Promise.all([
            this.updateSigFoxDevice(
                currentSigFoxSettings,
                dto,
                sigfoxGroup,
                sigfoxDevice
            ),
            this.changeDeviceTypeIfNeeded(
                currentSigFoxSettings,
                dto,
                sigfoxGroup,
                sigfoxDevice
            ),
        ]);
    }

    private async updateSigFoxDevice(
        currentSigFoxSettings: SigFoxApiDeviceContent,
        dto: CreateIoTDeviceDto,
        sigfoxGroup: SigFoxGroup,
        sigfoxDevice: SigFoxDevice
    ) {
        const updateDto: UpdateSigFoxApiDeviceRequestDto = {
            activable: true,
            automaticRenewal: currentSigFoxSettings.automaticRenewal,
            lat: dto.latitude,
            lng: dto.longitude,
            name: dto.name,
        };

        await this.sigfoxApiDeviceService.update(
            sigfoxGroup,
            sigfoxDevice.deviceId,
            updateDto
        );
    }

    private async changeDeviceTypeIfNeeded(
        currentSigFoxSettings: SigFoxApiDeviceContent,
        dto: CreateIoTDeviceDto,
        sigfoxGroup: SigFoxGroup,
        sigfoxDevice: SigFoxDevice
    ) {
        if (
            dto.sigfoxSettings.deviceTypeId != null &&
            currentSigFoxSettings.deviceType.id != dto.sigfoxSettings.deviceTypeId
        ) {
            this.logger.log(
                `Changing deviceType from ${currentSigFoxSettings.deviceType.id} to ${dto.sigfoxSettings.deviceTypeId}`
            );
            await this.sigfoxApiDeviceService.changeDeviceType(
                sigfoxGroup,
                sigfoxDevice.deviceId,
                dto.sigfoxSettings.deviceTypeId
            );
        }
    }

    private async createInSigfoxBackend(
        dto: CreateIoTDeviceDto,
        sigfoxGroup: SigFoxGroup
    ) {
        const sigfoxDto: CreateSigFoxApiDeviceRequestDto = this.mapToSigFoxDto(dto);

        try {
            return await this.sigfoxApiDeviceService.create(sigfoxGroup, sigfoxDto);
        } catch (err) {
            this.logger.error(`Error creating sigfox device`);
            throw err;
        }
    }

    private mapToSigFoxDto(dto: CreateIoTDeviceDto) {
        const sigfoxDto: CreateSigFoxApiDeviceRequestDto = {
            id: dto.sigfoxSettings.deviceId,
            name: dto.name,
            pac: dto.sigfoxSettings.pac,
            deviceTypeId: dto.sigfoxSettings.deviceTypeId,
            activable: true,
            automaticRenewal: true,
            lat: dto.latitude,
            lng: dto.longitude,
            prototype: dto.sigfoxSettings.prototype,
        };

        if (!sigfoxDto.prototype) {
            sigfoxDto.productCertificate = {
                key: dto.sigfoxSettings.endProductCertificate,
            };
        }
        return sigfoxDto;
    }

    private async mapLoRaWANDevice(
        dto: CreateIoTDeviceDto,
        lorawanDevice: LoRaWANDevice,
        isUpdate: boolean,
        lorawanDeviceEuis: ChirpstackDeviceId[] = null,
        loraApplications: ListAllChirpstackApplicationsResponseDto = null
    ): Promise<LoRaWANDevice> {
        lorawanDevice.deviceEUI = dto.lorawanSettings.devEUI;

        if (
            !isUpdate &&
            (await this.chirpstackDeviceService.isDeviceAlreadyCreated(
                dto.lorawanSettings.devEUI,
                lorawanDeviceEuis
            ))
        ) {
            throw new BadRequestException(ErrorCodes.IdInvalidOrAlreadyInUse);
        }

        try {
            const chirpstackDeviceDto = this.chirpstackDeviceService.makeCreateChirpstackDeviceDto(
                dto.lorawanSettings,
                dto.name
            );

            const applicationId = await this.chirpstackDeviceService.findOrCreateDefaultApplication(
                chirpstackDeviceDto,
                loraApplications
            );
            lorawanDevice.chirpstackApplicationId = applicationId;
            chirpstackDeviceDto.device.applicationID = applicationId.toString();

            // Create or update the LoRa device against Chirpstack API
            await this.chirpstackDeviceService.createOrUpdateDevice(
                chirpstackDeviceDto,
                lorawanDeviceEuis
            );
            lorawanDeviceEuis.push(chirpstackDeviceDto.device);
            await this.doActivation(dto, isUpdate);
        } catch (err) {
            this.logger.error(err);

            // This will also be thrown if a chirpstack device with the same name already exists
            if (err?.response?.data?.error == "object already exists") {
                throw new BadRequestException(ErrorCodes.NameInvalidOrAlreadyInUse);
            }

            throw err;
        }
        return lorawanDevice;
    }

    private async doActivation(
        dto: CreateIoTDeviceDto,
        isUpdate: boolean
    ): Promise<void> {
        if (dto.lorawanSettings.activationType == ActivationType.OTAA) {
            // OTAA Activate if key is provided
            await this.doActivationByOTAA(dto, isUpdate);
        } else if (dto.lorawanSettings.activationType == ActivationType.ABP) {
            await this.doActivationByABP(dto, isUpdate);
        }
    }

    private async doActivationByOTAA(dto: CreateIoTDeviceDto, isUpdate: boolean) {
        if (dto.lorawanSettings.OTAAapplicationKey) {
            await this.chirpstackDeviceService.activateDeviceWithOTAA(
                dto.lorawanSettings.devEUI,
                dto.lorawanSettings.OTAAapplicationKey,
                isUpdate
            );
        } else {
            throw new BadRequestException(ErrorCodes.MissingOTAAInfo);
        }
    }

    private async doActivationByABP(dto: CreateIoTDeviceDto, isUpdate: boolean) {
        if (
            dto.lorawanSettings.devAddr &&
            dto.lorawanSettings.fCntUp != null &&
            dto.lorawanSettings.nFCntDown != null &&
            dto.lorawanSettings.networkSessionKey &&
            dto.lorawanSettings.applicationSessionKey
        ) {
            await this.chirpstackDeviceService.activateDeviceWithABP(
                dto.lorawanSettings.devEUI,
                dto.lorawanSettings.devAddr,
                dto.lorawanSettings.fCntUp,
                dto.lorawanSettings.nFCntDown,
                dto.lorawanSettings.networkSessionKey,
                dto.lorawanSettings.applicationSessionKey,
                isUpdate
            );
        } else {
            throw new BadRequestException(ErrorCodes.MissingABPInfo);
        }
    }

    private async mapMQTTInternalBrokerDevice(
        iotDeviceDto: CreateIoTDeviceDto,
        cast: MQTTInternalBrokerDevice
    ): Promise<MQTTInternalBrokerDevice> {
        const settings = iotDeviceDto.mqttInternalBrokerSettings;
        validateMQTTInternalBroker(settings);
        cast.authenticationType = settings.authenticationType;
        switch (cast.authenticationType) {
            case AuthenticationType.PASSWORD:
                cast.mqttpasswordhash = this.mqttService.hashPassword(
                    settings.mqttpassword
                );
                cast.mqttpassword = this.encryptionHelperService.basicEncrypt(
                    settings.mqttpassword
                );
                cast.mqttusername = settings.mqttusername;
                break;
            case AuthenticationType.CERTIFICATE:
                if (!cast.deviceCertificate) {
                    const certificateDetails = await this.mqttService.generateCertificate(
                        cast.name
                    );
                    cast.deviceCertificate = certificateDetails.deviceCertificate;
                    cast.deviceCertificateKey = this.encryptionHelperService.basicEncrypt(
                        certificateDetails.deviceCertificateKey
                    );
                    cast.caCertificate = certificateDetails.ca;
                    cast.mqttusername = cast.name;
                    cast.mqttpassword = undefined;
                    cast.mqttpasswordhash = undefined;
                }
                break;
        }

        const topicDetails = await this.mqttService.createTopic(cast);
        cast.mqttURL = topicDetails.uRL;
        cast.mqttPort = topicDetails.port;
        cast.mqtttopicname = topicDetails.topicName;
        cast.permissions = MQTTPermissionLevel.write; // Hardcoded 'write' permission for now, as communication is oneway

        return cast;
    }

    private async mapMQTTExternalBrokerDevice(
        iotDeviceDto: CreateIoTDeviceDto,
        cast: MQTTExternalBrokerDevice,
        isUpdate: boolean = false
    ): Promise<MQTTExternalBrokerDevice> {
        const settings = iotDeviceDto.mqttExternalBrokerSettings;
        validateMQTTExternalBroker(settings);
        cast.authenticationType = settings.authenticationType;
        switch (cast.authenticationType) {
            case AuthenticationType.PASSWORD:
                cast.mqttpassword = this.encryptionHelperService.basicEncrypt(
                    settings.mqttpassword
                );
                cast.mqttusername = settings.mqttusername;
                break;
            case AuthenticationType.CERTIFICATE:
                cast.caCertificate = settings.caCertificate;
                cast.deviceCertificate = settings.deviceCertificate;
                cast.deviceCertificateKey = this.encryptionHelperService.basicEncrypt(
                    settings.deviceCertificateKey
                );
                break;
        }

        cast.mqttURL = settings.mqttURL;
        cast.mqttPort = settings.mqttPort;
        cast.mqtttopicname = settings.mqtttopicname;

        if (isUpdate) {
            await this.internalMqttClientListenerService.removeMQTTClient(cast);
            await this.createNewMQTTClients([cast]);
            cast.invalidMqttConfig = false;
        }

        return cast;
    }

    private async enrichMQTTInternalBrokerDevice(iotDevice: IoTDevice) {
        const device = iotDevice as MQTTInternalBrokerDeviceDTO;
        device.mqttInternalBrokerSettings = {
            authenticationType: device.authenticationType,
            caCertificate: device.caCertificate ?? fs.readFileSync(caCertPath).toString(),
            deviceCertificate: device.deviceCertificate,
            deviceCertificateKey: this.encryptionHelperService.basicDecrypt(
                device.deviceCertificateKey
            ),
            mqtttopicname: device.mqtttopicname,
            mqttURL: device.mqttURL,
            mqttPort: device.mqttPort,
            mqttusername: device.mqttusername,
            mqttpassword: this.encryptionHelperService.basicDecrypt(device.mqttpassword),
            permissions: device.permissions,
        };
        return device;
    }

    private async enrichMQTTExternalBrokerDevice(iotDevice: IoTDevice) {
        const device = iotDevice as MQTTExternalBrokerDeviceDTO;
        device.mqttExternalBrokerSettings = {
            authenticationType: device.authenticationType,
            caCertificate: device.caCertificate,
            deviceCertificate: device.deviceCertificate,
            deviceCertificateKey: this.encryptionHelperService.basicDecrypt(
                device.deviceCertificateKey
            ),
            mqtttopicname: device.mqtttopicname,
            mqttURL: device.mqttURL,
            mqttPort: device.mqttPort,
            mqttusername: device.mqttusername,
            mqttpassword: this.encryptionHelperService.basicDecrypt(device.mqttpassword),
            permissions: MQTTPermissionLevel.read,
            invalidMqttConfig: device.invalidMqttConfig,
        };
        return device;
    }

    private async handleNewMQTTDevices(dbIotDevices: IoTDevice[]) {
        await this.fixMQTTInternalBrokerTopics(dbIotDevices);
        await this.createNewMQTTClients(dbIotDevices);
    }

    private async fixMQTTInternalBrokerTopics(dbIotDevices: IoTDevice[]) {
        const newMQTTInternalBrokers = dbIotDevices.filter(
            (d: MQTTInternalBrokerDevice) =>
                d.type === IoTDeviceType.MQTTInternalBroker &&
                d.mqtttopicname.includes("undefined")
        );
        const remappedMQTT = [];
        for (const iotDevice of newMQTTInternalBrokers) {
            const mqttInternalBrokerDevice = iotDevice as MQTTInternalBrokerDevice;
            mqttInternalBrokerDevice.mqtttopicname = (
                await this.mqttService.createTopic(mqttInternalBrokerDevice)
            ).topicName;
            remappedMQTT.push(mqttInternalBrokerDevice);
        }
        await this.iotDeviceRepository.save(remappedMQTT);
    }

    private async createNewMQTTClients(dbIotDevices: IoTDevice[]) {
        const newMQTTExternalBrokers = dbIotDevices.filter(
            (d: MQTTExternalBrokerDevice) => d.type === IoTDeviceType.MQTTExternalBroker
        );
        try {
            this.internalMqttClientListenerService.createMQTTClients(
                newMQTTExternalBrokers as MQTTExternalBrokerDevice[]
            );
            // If something goes wrong delete the devices again.
        } catch (e) {
            await this.iotDeviceRepository.remove(dbIotDevices);
            throw new InternalServerErrorException(
                e,
                "Something went wrong when creating MQTT external broker client. Device removed"
            );
        }
    }
}
