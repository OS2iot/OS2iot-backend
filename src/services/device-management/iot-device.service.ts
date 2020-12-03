import {
    BadRequestException,
    Injectable,
    Logger,
    NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Point } from "geojson";
import { DeleteResult, Repository, getManager, SelectQueryBuilder } from "typeorm";

import { CreateIoTDeviceDto } from "@dto/create-iot-device.dto";
import { LoRaWANDeviceWithChirpstackDataDto } from "@dto/lorawan-device-with-chirpstack-data.dto";
import { UpdateIoTDeviceDto } from "@dto/update-iot-device.dto";
import { ErrorCodes } from "@entities/enum/error-codes.enum";
import { GenericHTTPDevice } from "@entities/generic-http-device.entity";
import { IoTDevice } from "@entities/iot-device.entity";
import { LoRaWANDevice } from "@entities/lorawan-device.entity";
import { SigFoxDevice } from "@entities/sigfox-device.entity";
import { iotDeviceTypeMap } from "@enum/device-type-mapping";
import { IoTDeviceType } from "@enum/device-type.enum";
import { ActivationType } from "@enum/lorawan-activation-type.enum";
import { ChirpstackDeviceService } from "@services/chirpstack/chirpstack-device.service";
import { ApplicationService } from "@services/device-management/application.service";
import { CreateSigFoxApiDeviceRequestDto } from "@dto/sigfox/external/create-sigfox-api-device-request.dto";
import { SigFoxApiDeviceService } from "@services/sigfox/sigfox-api-device.service";
import { SigFoxGroupService } from "@services/sigfox/sigfox-group.service";
import { SigFoxDeviceWithBackendDataDto } from "@dto/sigfox-device-with-backend-data.dto";
import { SigFoxGroup } from "@entities/sigfox-group.entity";
import { UpdateSigFoxApiDeviceRequestDto } from "@dto/sigfox/external/update-sigfox-api-device-request.dto";
import {
    SigFoxApiDeviceContent,
    SigFoxApiDeviceResponse,
} from "@dto/sigfox/external/sigfox-api-device-response.dto";
import { SigFoxApiDeviceTypeService } from "@services/sigfox/sigfox-api-device-type.service";
import { CreateSigFoxSettingsDto } from "@dto/create-sigfox-settings.dto";
import { CreateLoRaWANSettingsDto } from "@dto/create-lorawan-settings.dto";
import { DeviceDownlinkQueueResponseDto } from "@dto/chirpstack/chirpstack-device-downlink-queue-response.dto";
import { DeviceModel } from "@entities/device-model.entity";
import { DeviceModelService } from "./device-model.service";
import {
    IoTDeviceMinimal,
    IoTDeviceMinimalRaw,
    ListAllIoTDevicesMinimalResponseDto,
} from "@dto/list-all-iot-devices-minimal-response.dto";
import { AuthenticatedRequest } from "@dto/internal/authenticated-request";
import { ListAllEntitiesDto } from "@dto/list-all-entities.dto";
import { ListAllIoTDevicesResponseDto } from "@dto/list-all-iot-devices-response.dto";

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
        private applicationService: ApplicationService,
        private chirpstackDeviceService: ChirpstackDeviceService,
        private sigfoxApiDeviceService: SigFoxApiDeviceService,
        private sigfoxApiDeviceTypeService: SigFoxApiDeviceTypeService,
        private sigfoxGroupService: SigFoxGroupService,
        private deviceModelService: DeviceModelService
    ) {}
    private readonly logger = new Logger(IoTDeviceService.name);

    async findOne(id: number): Promise<IoTDevice> {
        return await this.iotDeviceRepository.findOneOrFail(id, {
            relations: ["application"],
        });
    }

    async findAllSigFoxDevices(): Promise<SigFoxDevice[]> {
        return await this.sigfoxRepository.find();
    }

    async findDevicesForApplication(
        applicationId: number,
        query: ListAllEntitiesDto
    ): Promise<ListAllIoTDevicesResponseDto> {
        let orderBy = `iot_device.id`;
        if (
            (query?.orderOn != null && query.orderOn == "id") ||
            query.orderOn == "name" ||
            query.orderOn == "active"
        ) {
            if (query.orderOn == "active") {
                orderBy = `metadata.sentTime`;
            } else {
                orderBy = `iot_device.${query.orderOn}`;
            }
        }

        const direction = query?.sort?.toUpperCase() == "DESC" ? "DESC" : "ASC";

        const [data, count] = await this.iotDeviceRepository
            .createQueryBuilder("iot_device")
            .where('"iot_device"."applicationId" = :applicationId', {
                applicationId: applicationId,
            })
            .leftJoinAndSelect("iot_device.receivedMessagesMetadata", "metadata")
            .skip(query?.offset ? +query.offset : 0)
            .take(query?.limit ? +query.limit : 100)
            .orderBy(orderBy, direction)
            .getManyAndCount();

        // Need to get LoRa details to get battery status ...
        await Promise.all(
            data.map(async x => {
                if (x.type == IoTDeviceType.LoRaWAN) {
                    x = await this.enrichLoRaWANDevice(x);
                }
            })
        );

        return {
            data: data,
            count: count,
        };
    }

    async findManyByIds(iotDeviceIds: number[]): Promise<IoTDevice[]> {
        if (iotDeviceIds == null || iotDeviceIds?.length == 0) {
            return [];
        }
        return await this.iotDeviceRepository.findByIds(iotDeviceIds, {
            relations: ["application"],
        });
    }

    async findOneWithApplicationAndMetadata(
        id: number,
        enrich?: boolean
    ): Promise<
        IoTDevice | LoRaWANDeviceWithChirpstackDataDto | SigFoxDeviceWithBackendDataDto
    > {
        // Repository syntax doesn't yet support ordering by relation: https://github.com/typeorm/typeorm/issues/2620
        // Therefore we use the QueryBuilder ...
        const iotDevice = await this.queryDatabaseForIoTDevice(id);

        if (iotDevice == null) {
            throw new NotFoundException();
        }
        if (enrich) {
            if (iotDevice.type == IoTDeviceType.LoRaWAN) {
                // Add more suplimental info about LoRaWAN devices.
                return await this.enrichLoRaWANDevice(iotDevice);
            } else if (iotDevice.type == IoTDeviceType.SigFox) {
                // Add more info about SigFox devices
                return await this.enrichSigFoxDevice(iotDevice);
            }
        }

        return iotDevice;
    }

    async enrichSigFoxDevice(
        iotDevice: IoTDevice
    ): Promise<SigFoxDeviceWithBackendDataDto> {
        const sigfoxDevice = iotDevice as SigFoxDeviceWithBackendDataDto;

        const sigfoxGroup = await this.sigfoxGroupService.findOneByGroupId(
            sigfoxDevice.groupId
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
        const organizations = req.user.permissions.getAllOrganizationsWithAtLeastAdmin();
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

    private async queryDatabaseForIoTDevice(id: number) {
        return await this.iotDeviceRepository
            .createQueryBuilder("iot_device")
            .loadAllRelationIds({ relations: ["createdBy", "updatedBy"] })
            .where("iot_device.id = :id", { id: id })
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
            .orderBy('metadata."sentTime"', "DESC")
            .getOne();
    }

    private async enrichLoRaWANDevice(iotDevice: IoTDevice) {
        const loraDevice = iotDevice as LoRaWANDeviceWithChirpstackDataDto;
        loraDevice.lorawanSettings = new CreateLoRaWANSettingsDto();
        await this.mapActivationAndKeys(loraDevice);
        const csData = await this.chirpstackDeviceService.getChirpstackDevice(
            loraDevice.deviceEUI
        );
        loraDevice.lorawanSettings.devEUI = csData.devEUI;
        loraDevice.lorawanSettings.deviceProfileID = csData.deviceProfileID;
        loraDevice.lorawanSettings.serviceProfileID = csData.serviceProfileID;
        loraDevice.lorawanSettings.skipFCntCheck = csData.skipFCntCheck;
        loraDevice.lorawanSettings.isDisabled = csData.isDisabled;
        loraDevice.lorawanSettings.deviceStatusBattery = csData.deviceStatusBattery;
        loraDevice.lorawanSettings.deviceStatusMargin = csData.deviceStatusMargin;

        const csAppliation = await this.chirpstackDeviceService.getChirpstackApplication(
            csData.applicationID
        );
        loraDevice.lorawanSettings.serviceProfileID =
            csAppliation.application.serviceProfileID;
        return loraDevice;
    }

    private async mapActivationAndKeys(loraDevice: LoRaWANDeviceWithChirpstackDataDto) {
        const keys = await this.chirpstackDeviceService.getKeys(loraDevice.deviceEUI);
        if (keys.nwkKey) {
            // OTAA
            loraDevice.lorawanSettings.activationType = ActivationType.OTAA;
            loraDevice.lorawanSettings.OTAAapplicationKey = keys.nwkKey;
        } else {
            const activation = await this.chirpstackDeviceService.getActivation(
                loraDevice.deviceEUI
            );
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

    async findGenericHttpDeviceByApiKey(key: string): Promise<GenericHTTPDevice> {
        return await this.genericHTTPDeviceRepository.findOne({ apiKey: key });
    }

    async findSigFoxDeviceByDeviceIdAndDeviceTypeId(
        deviceId: string,
        apiKey: string
    ): Promise<SigFoxDevice> {
        return await this.sigfoxRepository.findOne({
            deviceId: deviceId,
            deviceTypeId: apiKey,
        });
    }

    async findLoRaWANDeviceByDeviceEUI(deviceEUI: string): Promise<LoRaWANDevice> {
        // TODO: Fix potentiel SQL injection.
        return await this.loRaWANDeviceRepository.findOne({
            where: `"deviceEUI" ILIKE '${deviceEUI}'`,
        });
    }

    async create(
        createIoTDeviceDto: CreateIoTDeviceDto,
        userId: number
    ): Promise<IoTDevice> {
        const childType = iotDeviceTypeMap[createIoTDeviceDto.type];
        const iotDevice = new childType();

        const mappedIotDevice = await this.mapDtoToIoTDevice(
            createIoTDeviceDto,
            iotDevice,
            false
        );

        mappedIotDevice.createdBy = userId;
        mappedIotDevice.updatedBy = userId;

        const entityManager = getManager();
        return entityManager.save(mappedIotDevice);
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
        const existingIoTDevice = await this.iotDeviceRepository.findOneOrFail(id);

        const mappedIoTDevice = await this.mapDtoToIoTDevice(
            updateDto,
            existingIoTDevice,
            true
        );

        mappedIoTDevice.updatedBy = userId;
        const res = this.iotDeviceRepository.save(mappedIoTDevice);

        return res;
    }

    async delete(device: IoTDevice): Promise<DeleteResult> {
        if (device.type == IoTDeviceType.LoRaWAN) {
            const lorawanDevice = device as LoRaWANDevice;
            this.logger.debug(
                `Deleteing LoRaWANDevice ${lorawanDevice.id} / ${lorawanDevice.deviceEUI} in Chirpstack ...`
            );
            await this.chirpstackDeviceService.deleteDevice(lorawanDevice.deviceEUI);
        }

        return this.iotDeviceRepository.delete(device.id);
    }

    async deleteMany(ids: number[]): Promise<DeleteResult> {
        return this.iotDeviceRepository.delete(ids);
    }

    private async mapDtoToIoTDevice(
        createIoTDeviceDto: CreateIoTDeviceDto,
        iotDevice: IoTDevice,
        isUpdate: boolean
    ): Promise<IoTDevice> {
        iotDevice.name = createIoTDeviceDto.name;

        await this.setApplication(createIoTDeviceDto, iotDevice);

        if (createIoTDeviceDto.longitude != null && createIoTDeviceDto.latitude != null) {
            iotDevice.location = {
                type: "Point",
                coordinates: [createIoTDeviceDto.longitude, createIoTDeviceDto.latitude],
            } as Point;
        } else {
            iotDevice.location = null;
        }

        iotDevice.comment = createIoTDeviceDto.comment;
        iotDevice.commentOnLocation = createIoTDeviceDto.commentOnLocation;
        iotDevice.metadata = createIoTDeviceDto.metadata;
        iotDevice.deviceModel = await this.mapDeviceModel(iotDevice, createIoTDeviceDto);

        iotDevice = await this.mapChildDtoToIoTDevice(
            createIoTDeviceDto,
            iotDevice,
            isUpdate
        );

        return iotDevice;
    }

    async mapDeviceModel(
        iotDevice: IoTDevice,
        createIoTDeviceDto: CreateIoTDeviceDto
    ): Promise<DeviceModel> {
        if (createIoTDeviceDto.deviceModelId == undefined) {
            return null;
        }
        const deviceModel = await this.deviceModelService.getByIdWithRelations(
            createIoTDeviceDto.deviceModelId
        );
        const deviceModelOrganisationId = deviceModel.belongsTo.id;
        const application = await this.applicationService.findOneWithOrganisation(
            iotDevice.application.id
        );
        if (deviceModelOrganisationId != application.belongsTo.id) {
            throw new BadRequestException(ErrorCodes.OrganizationDoesNotMatch);
        }

        return deviceModel;
    }

    private async setApplication(
        createIoTDeviceDto: CreateIoTDeviceDto,
        iotDevice: IoTDevice
    ) {
        if (createIoTDeviceDto.applicationId != null) {
            iotDevice.application = await this.applicationService.findOneWithoutRelations(
                createIoTDeviceDto.applicationId
            );
        } else {
            iotDevice.application = null;
        }
    }

    private async mapChildDtoToIoTDevice(
        dto: CreateIoTDeviceDto,
        iotDevice: IoTDevice,
        isUpdate: boolean
    ): Promise<IoTDevice> {
        if (iotDevice.constructor.name === LoRaWANDevice.name) {
            const cast = <LoRaWANDevice>iotDevice;
            const loraDevice = await this.mapLoRaWANDevice(dto, cast, isUpdate);

            return <IoTDevice>loraDevice;
        } else if (iotDevice.constructor.name === SigFoxDevice.name) {
            const cast = <SigFoxDevice>iotDevice;
            const sigfoxDevice = await this.mapSigFoxDevice(dto, cast);

            return <IoTDevice>sigfoxDevice;
        }

        return iotDevice;
    }

    private async mapSigFoxDevice(
        dto: CreateIoTDeviceDto,
        cast: SigFoxDevice    ): Promise<SigFoxDevice> {
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
        isUpdate: boolean
    ): Promise<LoRaWANDevice> {
        lorawanDevice.deviceEUI = dto.lorawanSettings.devEUI;

        try {
            const chirpstackDeviceDto = await this.chirpstackDeviceService.makeCreateChirpstackDeviceDto(
                dto.lorawanSettings,
                dto.name
            );

            // Save application
            const applicationId = await this.chirpstackDeviceService.findOrCreateDefaultApplication(
                chirpstackDeviceDto
            );
            lorawanDevice.chirpstackApplicationId = applicationId;
            chirpstackDeviceDto.device.applicationID = applicationId.toString();

            await this.chirpstackDeviceService.createOrUpdateDevice(chirpstackDeviceDto);

            await this.doActivation(dto, isUpdate);
        } catch (err) {
            this.logger.error(err);
            throw new BadRequestException("Could not create device in Chirpstack", err);
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
}
