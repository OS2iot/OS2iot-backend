import { BadRequestException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { AxiosResponse } from "axios";

import { ChirpstackDeviceActivationContentsDto } from "@dto/chirpstack/chirpstack-device-activation-response.dto";
import { ChirpstackDeviceContentsDto } from "@dto/chirpstack/chirpstack-device-contents.dto";
import { ChirpstackDeviceKeysContentDto } from "@dto/chirpstack/chirpstack-device-keys-response.dto";
import { ChirpstackSingleApplicationResponseDto } from "@dto/chirpstack/chirpstack-single-application-response.dto";
import { CreateChirpstackApplicationDto } from "@dto/chirpstack/create-chirpstack-application.dto";
import { CreateChirpstackDeviceDto } from "@dto/chirpstack/create-chirpstack-device.dto";
import { ListAllChirpstackApplicationsResponseDto } from "@dto/chirpstack/list-all-applications-response.dto";
import { ListAllDevicesResponseDto } from "@dto/chirpstack/list-all-devices-response.dto";
import { CreateLoRaWANSettingsDto } from "@dto/create-lorawan-settings.dto";
import { GenericChirpstackConfigurationService } from "@services/chirpstack/generic-chirpstack-configuration.service";
import { CreateChirpstackDeviceQueueItemDto } from "@dto/chirpstack/create-chirpstack-device-queue-item.dto";
import {
    DeviceDownlinkQueueResponseDto,
    DeviceQueueItem,
} from "@dto/chirpstack/chirpstack-device-downlink-queue-response.dto";
import { ErrorCodes } from "@enum/error-codes.enum";
import { ChirpstackManyDeviceResponseDto } from "@dto/chirpstack/chirpstack-many-device-response";
import { IoTDevice } from "@entities/iot-device.entity";
import { LoRaWANDeviceWithChirpstackDataDto } from "@dto/lorawan-device-with-chirpstack-data.dto";
import { ActivationType } from "@enum/lorawan-activation-type.enum";
import { ChirpstackDeviceId } from "@dto/chirpstack/chirpstack-device-id.dto";
import { ChirpstackApplicationResponseDto } from "@dto/chirpstack/chirpstack-application-response.dto";
import { groupBy } from "lodash";
import {
    LoRaWANStatsElementDto,
    LoRaWANStatsResponseDto,
} from "@dto/chirpstack/device/lorawan-stats.response.dto";
import { ConfigService } from "@nestjs/config";
import { DeviceServiceClient } from "@chirpstack/chirpstack-api/api/device_grpc_pb";

import { ServiceError, credentials } from "@grpc/grpc-js";
import {
    Application,
    CreateApplicationRequest,
    GetApplicationRequest,
    GetApplicationResponse,
    ListApplicationsRequest,
} from "@chirpstack/chirpstack-api/api/application_pb";
import {
    ActivateDeviceRequest,
    CreateDeviceKeysRequest,
    CreateDeviceRequest,
    DeleteDeviceRequest,
    Device,
    DeviceActivation,
    DeviceKeys,
    DeviceQueueItem as DeviceQueueItemChirpstack,
    EnqueueDeviceQueueItemRequest,
    FlushDeviceQueueRequest,
    GetDeviceActivationRequest,
    GetDeviceActivationResponse,
    GetDeviceKeysRequest,
    GetDeviceKeysResponse,
    GetDeviceLinkMetricsRequest,
    GetDeviceLinkMetricsResponse,
    GetDeviceQueueItemsRequest,
    GetDeviceQueueItemsResponse,
    GetDeviceRequest,
    GetDeviceResponse,
    ListDevicesRequest,
    UpdateDeviceKeysRequest,
    UpdateDeviceRequest,
} from "@chirpstack/chirpstack-api/api/device_pb";
import { PostReturnInterface } from "@interfaces/chirpstack-post-return.interface";
import { dateToTimestamp } from "@helpers/date.helper";
import { Timestamp } from "google-protobuf/google/protobuf/timestamp_pb";
import { Aggregation } from "@chirpstack/chirpstack-api/common/common_pb";
import { DeviceMetricsDto, MetricProperties } from "@dto/chirpstack/chirpstack-device-metrics.dto";
import { LoRaWANDevice } from "@entities/lorawan-device.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Application as DbApplication } from "@entities/application.entity";
@Injectable()
export class ChirpstackDeviceService extends GenericChirpstackConfigurationService {
    @InjectRepository(DbApplication)
    private applicationRepository: Repository<DbApplication>;

    constructor(private configService: ConfigService) {
        super();

        this.deviceStatsIntervalInDays = configService.get<number>(
            "backend.deviceStatsIntervalInDays"
        );
    }
    private deviceServiceClient = new DeviceServiceClient(
        this.baseUrlGRPC,
        credentials.createInsecure()
    );

    private readonly logger = new Logger(ChirpstackDeviceService.name);

    defaultApplicationName = "os2iot";

    DEVICE_NAME_PREFIX = "OS2IOT-";
    DEFAULT_DESCRIPTION = "Created by OS2IoT";
    private readonly deviceStatsIntervalInDays: number;

    async findOrCreateDefaultApplication(
        applications: ListAllChirpstackApplicationsResponseDto = null,
        iotDevice: LoRaWANDevice
    ): Promise<string> {
        const organizationID = await this.getDefaultOrganizationId();
        const req = new ListApplicationsRequest();
        req.setTenantId(organizationID);
        // Fetch applications
        applications =
            applications ??
            (await this.getAllWithPagination<ListAllChirpstackApplicationsResponseDto>(
                `applications?limit=100&organizationID=${organizationID}`,
                100,
                undefined,
                this.applicationServiceClient
            ));

        // if application exist use it
        let applicationId = applications.result.find(
            element =>
                element.id === iotDevice.chirpstackApplicationId ||
                element.id === iotDevice.application.chirpstackId
        )?.id;

        // otherwise create new application
        if (!applicationId) {
            applicationId = await this.createNewApplication(
                applicationId,
                organizationID,
                iotDevice.application.name,
                iotDevice.application.id
            );
        }

        return applicationId;
    }

    private async createNewApplication(
        applicationId: string,
        organizationID: string,
        name: string,
        id: number
    ) {
        applicationId = await this.createApplication({
            application: {
                name: `${this.defaultApplicationName}-${name}`,
                description: this.DEFAULT_DESCRIPTION,
                tenantId: organizationID,
            },
        });
        const existingApplication = await this.applicationRepository.findOneOrFail({
            where: { id: id },
        });
        existingApplication.chirpstackId = applicationId;
        await this.applicationRepository.save(existingApplication)
        return applicationId;
    }

    makeCreateChirpstackDeviceDto(
        dto: CreateLoRaWANSettingsDto,
        name: string
    ): CreateChirpstackDeviceDto {
        const csDto = new ChirpstackDeviceContentsDto();
        csDto.name = `${this.DEVICE_NAME_PREFIX}${name}`.toLowerCase();
        csDto.description = this.DEFAULT_DESCRIPTION;
        csDto.devEUI = dto.devEUI;
        csDto.deviceProfileID = dto.deviceProfileID;

        csDto.isDisabled = dto.isDisabled;
        csDto.skipFCntCheck = dto.skipFCntCheck;

        return { device: csDto };
    }

    async overwriteDownlink(dto: CreateChirpstackDeviceQueueItemDto): Promise<PostReturnInterface> {
        await this.deleteDownlinkQueue(dto.deviceQueueItem.devEUI);
        try {
            const req = new EnqueueDeviceQueueItemRequest();
            const queueItem = new DeviceQueueItemChirpstack();
            queueItem.setConfirmed(dto.deviceQueueItem.confirmed);
            queueItem.setData(dto.deviceQueueItem.data);
            queueItem.setDevEui(dto.deviceQueueItem.devEUI);
            queueItem.setFPort(dto.deviceQueueItem.fPort);
            req.setQueueItem(queueItem);

            const res = await this.postDownlink(this.deviceServiceClient, req);
            return res;
        } catch (err) {
            const fcntError =
                "enqueue downlink payload error: get next downlink fcnt for deveui error";
            if (err?.response?.data?.error?.startsWith(fcntError)) {
                throw new BadRequestException(ErrorCodes.DeviceIsNotActivatedInChirpstack);
            }

            throw err;
        }
    }

    async deleteDevice(deviceEUI: string): Promise<void> {
        try {
            const req = new DeleteDeviceRequest();
            req.setDevEui(deviceEUI);
            await this.delete(`devices`, this.deviceServiceClient, req);
        } catch (err) {
            throw err;
        }
    }

    async getDownlinkQueue(deviceEUI: string): Promise<DeviceDownlinkQueueResponseDto> {
        const req = new GetDeviceQueueItemsRequest();
        req.setDevEui(deviceEUI);
        const res = await this.getQueue(this.deviceServiceClient, req);

        const queueDto: DeviceQueueItem[] = [];
        res.getResultList().forEach(queueItem => {
            queueDto.push({
                confirmed: queueItem.getConfirmed(),
                devEUI: queueItem.getDevEui(),
                fCnt: queueItem.getFCntDown(),
                fPort: queueItem.getFPort(),
                data: queueItem.getData_asB64(),
            });
        });

        const responseDto: DeviceDownlinkQueueResponseDto = {
            totalCount: res.getTotalCount(),
            deviceQueueItems: queueDto,
        };
        return responseDto;
    }

    async deleteDownlinkQueue(deviceEUI: string): Promise<void> {
        const req = new FlushDeviceQueueRequest();
        req.setDevEui(deviceEUI);
        await this.deleteQueue(this.deviceServiceClient, req);
    }

    async activateDeviceWithABP(
        devEUI: string,
        devAddr: string,
        fCntUp: number,
        nFCntDown: number,
        networkSessionKey: string,
        applicationSessionKey: string
    ): Promise<boolean> {
        const res = await this.createOrUpdateABPActivation(
            devAddr,
            networkSessionKey,
            applicationSessionKey,
            fCntUp,
            nFCntDown,
            devEUI
        );
        if (!res) {
            this.logger.warn(`Could not ABP activate Chirpstack Device using DEVEUI: ${devEUI}}`);
            return false;
        }
        return true;
    }

    async getAllDevicesStatus(): Promise<ChirpstackManyDeviceResponseDto> {
        const req = new ListDevicesRequest();
        req.setLimit(10000);
        req.setOffset(0);
        const test = await this.get<ChirpstackManyDeviceResponseDto>(
            `devices`,
            this.deviceServiceClient,
            req
        );

        return test;
    }

    private async createOrUpdateABPActivation(
        devAddr: string,
        networkSessionKey: string,
        applicationSessionKey: string,
        fCntUp: number,
        nFCntDown: number,
        devEUI: string
    ) {
        const req = new ActivateDeviceRequest();
        const deviceActivation = this.mapActivationToChirpstack(
            devAddr,
            networkSessionKey,
            applicationSessionKey,
            fCntUp,
            nFCntDown,
            devEUI
        );
        req.setDeviceActivation(deviceActivation);
        try {
            await this.postActivation(this.deviceServiceClient, req);
        } catch (e) {
            return false;
        }

        return true;
    }
    mapActivationToChirpstack(
        devAddr: string,
        networkSessionKey: string,
        applicationSessionKey: string,
        fCntUp: number,
        nFCntDown: number,
        devEUI: string
    ) {
        const deviceActivation = new DeviceActivation();
        deviceActivation.setDevAddr(devAddr);
        deviceActivation.setNwkSEncKey(networkSessionKey);
        deviceActivation.setAppSKey(applicationSessionKey);
        deviceActivation.setFCntUp(fCntUp);
        deviceActivation.setNFCntDown(nFCntDown);
        deviceActivation.setDevEui(devEUI);
        deviceActivation.setFNwkSIntKey(networkSessionKey);
        deviceActivation.setSNwkSIntKey(networkSessionKey);
        return deviceActivation;
    }

    async activateDeviceWithOTAA(
        deviceEUI: string,
        nwkKey: string,
        isUpdate: boolean
    ): Promise<boolean> {
        try {
            if (isUpdate) {
                const req = new UpdateDeviceKeysRequest();
                const deviceKeys = this.mapDeviceKeysToChirpstack(deviceEUI, nwkKey);
                req.setDeviceKeys(deviceKeys);
                await this.putKeys(this.deviceServiceClient, req);
            } else {
                const req = new CreateDeviceKeysRequest();
                const deviceKeys = this.mapDeviceKeysToChirpstack(deviceEUI, nwkKey);
                req.setDeviceKeys(deviceKeys);

                await this.postKeys(this.deviceServiceClient, req);
            }
        } catch (e) {
            return false;
        }

        return true;
    }

    mapDeviceKeysToChirpstack(deviceEUI: string, nwkKey: string) {
        const deviceKeys = new DeviceKeys();
        deviceKeys.setDevEui(deviceEUI);
        deviceKeys.setNwkKey(nwkKey);
        return deviceKeys;
    }

    async createOrUpdateDevice(
        dto: CreateChirpstackDeviceDto,
        lorawanDevices: ChirpstackDeviceId[] = null
    ): Promise<boolean> {
        try {
            if (await this.isDeviceAlreadyCreated(dto.device.devEUI, lorawanDevices)) {
                const req = new UpdateDeviceRequest();
                const device = this.mapDeviceToChirpstack(dto);
                req.setDevice(device);
                await this.put(`devices`, this.deviceServiceClient, req);
            } else {
                const req = new CreateDeviceRequest();
                const device = this.mapDeviceToChirpstack(dto);
                req.setDevice(device);
                await this.post(`devices`, this.deviceServiceClient, req);
            }
        } catch (e) {
            return false;
        }
        return true;
    }

    mapDeviceToChirpstack(dto: CreateChirpstackDeviceDto): Device {
        const device = new Device();
        device.setApplicationId(dto.device.applicationID);
        device.setDescription(dto.device.description);
        device.setDevEui(dto.device.devEUI);
        device.setDeviceProfileId(dto.device.deviceProfileID);
        device.setIsDisabled(dto.device.isDisabled);
        device.setName(dto.device.name);
        device.setSkipFcntCheck(dto.device.skipFCntCheck);
        return device;
    }
    async getChirpstackApplication(id: string): Promise<ChirpstackSingleApplicationResponseDto> {
        const req = new GetApplicationRequest();
        req.setId(id);
        try {
            const csApplication = await this.get<GetApplicationResponse>(
                `applications/${id}`,
                this.applicationServiceClient,
                req
            );

            const applicationDto = new ChirpstackApplicationResponseDto();

            applicationDto.name = csApplication.getApplication().getName();
            applicationDto.description = csApplication.getApplication().getDescription();
            applicationDto.id = csApplication.getApplication().getId();
            applicationDto.tenantId = csApplication.getApplication().getTenantId();

            const returnDto = new ChirpstackSingleApplicationResponseDto();
            returnDto.application = applicationDto;

            return returnDto;
        } catch (err) {
            throw new BadRequestException(ErrorCodes.CouldntGetApplications);
        }
    }

    async getChirpstackDevice(id: string): Promise<ChirpstackDeviceContentsDto> {
        try {
            const req = new GetDeviceRequest();
            req.setDevEui(id);

            const res = await this.get<GetDeviceResponse>(
                `devices/${id}`,
                this.deviceServiceClient,
                req
            );

            const deviceDto: ChirpstackDeviceContentsDto = {
                deviceStatusBattery: res.getDeviceStatus()?.getBatteryLevel(),
                deviceStatusMargin: res.getDeviceStatus()?.getMargin(),
                devEUI: res.getDevice().getDevEui(),
                deviceProfileID: res.getDevice().getDeviceProfileId(),
                applicationID: res.getDevice().getApplicationId(),
                description: res.getDevice().getDescription(),
                isDisabled: res.getDevice().getIsDisabled(),
                name: res.getDevice().getName(),
                skipFCntCheck: res.getDevice().getSkipFcntCheck(),
                tags: res.getDevice().getTagsMap().toObject(),
                variables: res.getDevice().getVariablesMap().toObject(),
            };

            return deviceDto;
        } catch (err) {
            throw new BadRequestException(ErrorCodes.CouldntGetApplications);
        }
    }

    async getDeviceKeys(deviceId: string): Promise<ChirpstackDeviceKeysContentDto> {
        try {
            const req = new GetDeviceKeysRequest();
            req.setDevEui(deviceId);

            const res = await this.getKeys(this.deviceServiceClient, req);

            const keysDto: ChirpstackDeviceKeysContentDto = {
                appKey: res.getDeviceKeys().getAppKey(),
                devEUI: res.getDeviceKeys().getDevEui(),
                nwkKey: res.getDeviceKeys().getNwkKey(),
            };

            return keysDto;
        } catch (err) {
            // Chirpstack returns 404 if keys are not saved ..
            // It seems like that the current logic is using this catch to see if the device is an ABP or OTAA device.
            return new ChirpstackDeviceKeysContentDto();
        }
    }

    async getDeviceActivation(deviceId: string): Promise<ChirpstackDeviceActivationContentsDto> {
        try {
            const req = new GetDeviceActivationRequest();
            req.setDevEui(deviceId);

            const res = await this.getActivation(this.deviceServiceClient, req);

            const activationDto: ChirpstackDeviceActivationContentsDto = {
                aFCntDown: res.getDeviceActivation().getAFCntDown(),
                devEUI: res.getDeviceActivation().getDevEui(),
                appSKey: res.getDeviceActivation().getAppSKey(),
                devAddr: res.getDeviceActivation().getDevAddr(),
                fCntUp: res.getDeviceActivation().getFCntUp(),
                fNwkSIntKey: res.getDeviceActivation().getFNwkSIntKey(),
                nFCntDown: res.getDeviceActivation().getAFCntDown(),
                nwkSEncKey: res.getDeviceActivation().getNwkSEncKey(),
                sNwkSIntKey: res.getDeviceActivation().getSNwkSIntKey(),
            };
            return activationDto;
        } catch (err) {
            return new ChirpstackDeviceActivationContentsDto();
        }
    }

    /**
     * Fetch and set LoRaWAN settings on the given device. This is not immutable.
     * @param iotDevice
     * @param applications
     * @returns The mutated device
     */
    async enrichLoRaWANDevice(iotDevice: IoTDevice): Promise<LoRaWANDeviceWithChirpstackDataDto> {
        const loraDevice = iotDevice as LoRaWANDeviceWithChirpstackDataDto;
        loraDevice.lorawanSettings = new CreateLoRaWANSettingsDto();
        await this.mapActivationAndKeys(loraDevice);
        const csData = await this.getChirpstackDevice(loraDevice.deviceEUI);
        loraDevice.lorawanSettings.devEUI = csData.devEUI;
        loraDevice.lorawanSettings.deviceProfileID = csData.deviceProfileID;
        loraDevice.lorawanSettings.skipFCntCheck = csData.skipFCntCheck;
        loraDevice.lorawanSettings.isDisabled = csData.isDisabled;
        loraDevice.lorawanSettings.deviceStatusBattery = csData.deviceStatusBattery;
        loraDevice.lorawanSettings.deviceStatusMargin = csData.deviceStatusMargin;

        return loraDevice;
    }

    private async mapActivationAndKeys(loraDevice: LoRaWANDeviceWithChirpstackDataDto) {
        const keys = await this.getDeviceKeys(loraDevice.deviceEUI);
        if (keys.nwkKey) {
            // OTAA
            loraDevice.lorawanSettings.activationType = ActivationType.OTAA;
            loraDevice.lorawanSettings.OTAAapplicationKey = keys.nwkKey;
        } else {
            const activation = await this.getDeviceActivation(loraDevice.deviceEUI);
            if (activation.devAddr != null) {
                // ABP
                loraDevice.lorawanSettings.activationType = ActivationType.ABP;
                loraDevice.lorawanSettings.devAddr = activation.devAddr;
                loraDevice.lorawanSettings.fCntUp = activation.fCntUp;
                loraDevice.lorawanSettings.nFCntDown = activation.nFCntDown;
                loraDevice.lorawanSettings.networkSessionKey = activation.nwkSEncKey;
                loraDevice.lorawanSettings.applicationSessionKey = activation.appSKey;
            } else {
                loraDevice.lorawanSettings.activationType = ActivationType.NONE;
            }
        }
    }

    async isDeviceAlreadyCreated(
        deviceEUI: string,
        chirpstackIds: ChirpstackDeviceId[] = null
    ): Promise<boolean> {
        const devices = !chirpstackIds ? await this.getAllChirpstackDevices() : chirpstackIds;
        const alreadyExists = devices.some(x => x.devEUI.toLowerCase() === deviceEUI.toLowerCase());
        return alreadyExists;
    }

    async getStats(deviceEUI: string): Promise<LoRaWANStatsResponseDto> {
        const now = new Date();
        const to_time = dateToTimestamp(now);
        const from_time = new Date(
            new Date().setDate(now.getDate() - this.deviceStatsIntervalInDays)
        );
        const from_time_timestamp: Timestamp = dateToTimestamp(from_time);

        const req = new GetDeviceLinkMetricsRequest();
        req.setDevEui(deviceEUI);
        req.setStart(from_time_timestamp);
        req.setEnd(to_time);
        req.setAggregation(Aggregation.DAY);
        const metaData = await this.makeMetadataHeader();

        const getDeviceMetricsPromise = new Promise<GetDeviceLinkMetricsResponse>(
            (resolve, reject) => {
                this.deviceServiceClient.getLinkMetrics(req, metaData, (err, resp) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(resp);
                    }
                });
            }
        );
        try {
            const metrics = await getDeviceMetricsPromise;
            return this.mapMetrics(metrics);
        } catch (err) {
            throw new BadRequestException(err);
        }
    }
    private mapMetrics(metrics: GetDeviceLinkMetricsResponse): LoRaWANStatsResponseDto {
        const statsElementDto: LoRaWANStatsElementDto[] = [];
        const packetCounts: DeviceMetricsDto = {};

        const rssiTimestamp = metrics.getGwRssi().getTimestampsList();
        const rssis = metrics
            .getGwRssi()
            .getDatasetsList()
            .find(e => e.getLabel() === "rssi")
            .getDataList();

        this.processPackets(rssiTimestamp, rssis, MetricProperties.rssi, packetCounts);

        const snrTimestamp = metrics.getGwSnr().getTimestampsList();
        const snr = metrics
            .getGwSnr()
            .getDatasetsList()
            .find(e => e.getLabel() === "snr")
            .getDataList();

        this.processPackets(snrTimestamp, snr, MetricProperties.snr, packetCounts);

        const drTimestamp = metrics.getRxPacketsPerDr().getTimestampsList();
        const drDatasets = metrics.getRxPacketsPerDr().getDatasetsList();

        drDatasets.forEach(drDataset => {
            const drLabel = drDataset.getLabel();
            const drData = drDataset.getDataList();
            this.processPackets(drTimestamp, drData, MetricProperties.dr, packetCounts, drLabel);
        });

        Object.keys(packetCounts).forEach(timestamp => {
            const packetCount = packetCounts[timestamp];
            const dto: LoRaWANStatsElementDto = {
                timestamp,
                gwRssi: packetCount.rssi,
                gwSnr: packetCount.snr,
                rxPacketsPerDr: packetCount.rxPacketsPerDr,
            };
            statsElementDto.push(dto);
        });
        return { result: statsElementDto };
    }
    private processPackets = (
        timestamps: Array<Timestamp>,
        packets: number[],
        key: string,
        packetCounts: DeviceMetricsDto,
        drLabel?: string
    ) => {
        timestamps.forEach((timestamp, index) => {
            const isoTimestamp = timestamp.toDate().toISOString();
            packetCounts[isoTimestamp] = packetCounts[isoTimestamp] || {
                rssi: 0,
                snr: 0,
                rxPacketsPerDr: {},
            };

            if (drLabel) {
                packetCounts[isoTimestamp].rxPacketsPerDr[drLabel as any] = packets[index];
            } else {
                (packetCounts[isoTimestamp] as any)[key] = packets[index];
            }
        });
    };

    /**
     * Fetch LoRaWAN applications by the device application id. This **assumes** that
     * the device chirpstack application id always reflects what's on Chirpstack.
     * @param devices
     * @returns
     */
    public async getLoRaWANApplications(
        devices: LoRaWANDeviceWithChirpstackDataDto[]
    ): Promise<ChirpstackSingleApplicationResponseDto[]> {
        const loraDevicesByAppId = groupBy(devices, device => device.chirpstackApplicationId);

        const res: ChirpstackSingleApplicationResponseDto[] = [];

        // Avoid async .forEach and .map when querying the API. They execute whatever's inside in "parallel" which can result in timeouts.
        for (const appId of Object.keys(loraDevicesByAppId)) {
            res.push(await this.getChirpstackApplication(appId));
        }

        return res;
    }

    private async getAllChirpstackDevices(limit = 1000): Promise<ChirpstackDeviceContentsDto[]> {
        return (await this.get<ListAllDevicesResponseDto>(`devices?limit=${limit}`)).result;
    }

    private async createApplication(dto: CreateChirpstackApplicationDto): Promise<string> {
        const req = new CreateApplicationRequest();
        const application = new Application();
        application.setDescription(dto.application.description);
        application.setName(dto.application.name);
        application.setTenantId(dto.application.tenantId);

        req.setApplication(application);
        const applicationIdObject: PostReturnInterface = await this.post(
            "applications",
            this.applicationServiceClient,
            req
        );
        return applicationIdObject.id;
    }

    async getKeys(
        client: DeviceServiceClient,
        request: GetDeviceKeysRequest
    ): Promise<GetDeviceKeysResponse> {
        const metaData = await this.makeMetadataHeader();
        const getPromise = new Promise<GetDeviceKeysResponse>((resolve, reject) => {
            client.getKeys(request, metaData, (err: ServiceError, resp: any) => {
                if (err) {
                    reject(err);
                } else {
                    this.logger.debug(`get from Keys success`);
                    resolve(resp);
                }
            });
        });
        try {
            return await getPromise;
        } catch (err) {
            throw new NotFoundException();
        }
    }
    async postKeys(client: DeviceServiceClient, request: CreateDeviceKeysRequest): Promise<void> {
        const metaData = await this.makeMetadataHeader();
        const createPromise = new Promise<void>((resolve, reject) => {
            client.createKeys(request, metaData, (err: ServiceError, resp: any) => {
                if (err) {
                    reject(err);
                } else {
                    this.logger.debug(`post KEYS success`);
                    resolve(resp);
                }
            });
        });
        try {
            return await createPromise;
        } catch (err) {
            this.logger.error(`POST KEYS got error: ${err}`);
            throw new BadRequestException();
        }
    }
    async putKeys(client: DeviceServiceClient, request: UpdateDeviceKeysRequest): Promise<void> {
        const metaData = await this.makeMetadataHeader();
        const updatePromise = new Promise<void>((resolve, reject) => {
            client.updateKeys(request, metaData, (err: ServiceError, resp: any) => {
                if (err) {
                    reject(err);
                } else {
                    this.logger.debug(`update KEYS success`);
                    resolve(resp);
                }
            });
        });
        try {
            return await updatePromise;
        } catch (err) {
            this.logger.error(`UPDATE KEYS got error: ${err}`);
            throw new BadRequestException();
        }
    }

    async getQueue(
        client: DeviceServiceClient,
        request: GetDeviceQueueItemsRequest
    ): Promise<GetDeviceQueueItemsResponse> {
        const metaData = await this.makeMetadataHeader();
        const getPromise = new Promise<GetDeviceQueueItemsResponse>((resolve, reject) => {
            client.getQueue(request, metaData, (err: ServiceError, resp: any) => {
                if (err) {
                    reject(err);
                } else {
                    this.logger.debug(`get from Queue success`);
                    resolve(resp);
                }
            });
        });
        try {
            return await getPromise;
        } catch (err) {
            throw new NotFoundException();
        }
    }
    async deleteQueue(
        client: DeviceServiceClient,
        request: FlushDeviceQueueRequest
    ): Promise<void> {
        const metaData = await this.makeMetadataHeader();
        const getPromise = new Promise<void>((resolve, reject) => {
            client.flushQueue(request, metaData, (err: ServiceError, resp: any) => {
                if (err) {
                    reject(err);
                } else {
                    this.logger.debug(`Delete queue success`);
                    resolve(resp);
                }
            });
        });
        try {
            return await getPromise;
        } catch (err) {
            this.logger.error(`DELETE queue got error: ${err}`);
            throw new BadRequestException();
        }
    }

    async postDownlink(
        client: DeviceServiceClient,
        request: EnqueueDeviceQueueItemRequest
    ): Promise<PostReturnInterface> {
        const metaData = await this.makeMetadataHeader();
        const createPromise = new Promise<PostReturnInterface>((resolve, reject) => {
            client.enqueue(request, metaData, (err: ServiceError, resp: any) => {
                if (err) {
                    reject(err);
                } else {
                    this.logger.debug(`post downlink success`);
                    resolve(resp.toObject());
                }
            });
        });
        try {
            return await createPromise;
        } catch (err) {
            this.logger.error(`POST downlink got error: ${err}`);
            throw new BadRequestException();
        }
    }

    async getActivation(
        client: DeviceServiceClient,
        request: GetDeviceActivationRequest
    ): Promise<GetDeviceActivationResponse> {
        const metaData = await this.makeMetadataHeader();
        const getPromise = new Promise<GetDeviceActivationResponse>((resolve, reject) => {
            client.getActivation(request, metaData, (err: ServiceError, resp: any) => {
                if (err) {
                    reject(err);
                } else {
                    this.logger.debug(`get from Activation success`);
                    resolve(resp);
                }
            });
        });
        try {
            return await getPromise;
        } catch (err) {
            this.logger.error(`GET Activation got error: ${err}`);
            throw new NotFoundException();
        }
    }
    async postActivation(
        client?: DeviceServiceClient,
        request?: ActivateDeviceRequest
    ): Promise<void> {
        const metaData = await this.makeMetadataHeader();
        const createPromise = new Promise<void>((resolve, reject) => {
            client.activate(request, metaData, (err: ServiceError, resp: any) => {
                if (err) {
                    reject(err);
                } else {
                    this.logger.debug(`post ACTIVATION success`);
                    resolve(resp);
                }
            });
        });
        try {
            return await createPromise;
        } catch (err) {
            this.logger.error(`POST ACTIVATION got error: ${err}`);
            throw new BadRequestException();
        }
    }
}
