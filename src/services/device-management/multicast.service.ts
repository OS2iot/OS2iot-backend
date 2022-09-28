import { CreateMulticastChirpStackDto } from "@dto/chirpstack/create-multicast-chirpstack.dto";
import { ListAllMulticastsResponseDto } from "@dto/list-all-multicasts-response.dto";
import { ListAllMulticastsDto } from "@dto/list-all-multicasts.dto";
import { Multicast } from "@entities/multicast.entity";
import { ErrorCodes } from "@enum/error-codes.enum";
import {
    BadRequestException,
    forwardRef,
    Inject,
    Injectable,
    Logger,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { GenericChirpstackConfigurationService } from "@services/chirpstack/generic-chirpstack-configuration.service";
import { DeleteResult, Repository, SelectQueryBuilder } from "typeorm";
import { CreateMulticastDto } from "../../entities/dto/create-multicast.dto";
import { UpdateMulticastDto } from "../../entities/dto/update-multicast.dto";
import { ApplicationService } from "./application.service";
import { AxiosResponse } from "axios";
import { ChirpstackMulticastContentsDto } from "@dto/chirpstack/chirpstack-multicast-contents.dto";
import { LorawanMulticastDefinition } from "@entities/lorawan-multicast.entity";
import { IoTDeviceType } from "@enum/device-type.enum";
import { AddDeviceToMulticastDto } from "@dto/chirpstack-add-device-multicast.dto";
import { LoRaWANDevice } from "@entities/lorawan-device.entity";
import { IoTDevice } from "@entities/iot-device.entity";
import { MulticastDownlinkQueueResponseDto } from "@dto/chirpstack/chirpstack-multicast-downlink-queue-response.dto";
import { CreateMulticastDownlinkDto } from "@dto/create-multicast-downlink.dto";
import {
    CreateChirpstackMulticastQueueItemDto,
    CreateChirpstackMulticastQueueItemResponse,
} from "@dto/chirpstack/create-chirpstack-multicast-queue-item.dto";
import { ChirpstackDeviceService } from "@services/chirpstack/chirpstack-device.service";
import { ChirpstackDeviceContentsDto } from "@dto/chirpstack/chirpstack-device-contents.dto";
import { HttpService } from "@nestjs/axios";

@Injectable()
export class MulticastService extends GenericChirpstackConfigurationService {
    constructor(
        internalHttpService: HttpService,

        @InjectRepository(Multicast)
        private multicastRepository: Repository<Multicast>,
        @Inject(forwardRef(() => ApplicationService)) // because of circular reference
        private applicationService: ApplicationService,
        private chirpStackDeviceService: ChirpstackDeviceService
    ) {
        super(internalHttpService);
    }
    private readonly logger = new Logger(MulticastService.name);
    multicastGroupUrl = "multicast-groups";

    async findAndCountAllWithPagination(
        // inspired by datatarget and other places in this project.
        // Repository syntax doesn't yet support ordering by relation: https://github.com/typeorm/typeorm/issues/2620
        // Therefore we use the QueryBuilder ...
        query?: ListAllMulticastsDto,
        applicationIds?: number[]
    ): Promise<ListAllMulticastsResponseDto> {
        const orderByColumn = this.getSortingForMulticasts(query);
        const direction = query?.sort?.toUpperCase() == "DESC" ? "DESC" : "ASC";

        let queryBuilder = this.multicastRepository
            .createQueryBuilder("multicast")
            .innerJoinAndSelect("multicast.application", "application")
            .innerJoinAndSelect(
                "multicast.lorawanMulticastDefinition",
                "lorawan-multicast"
            )
            .skip(query?.offset ? +query.offset : 0)
            .take(query?.limit ? +query.limit : 100)
            .orderBy(orderByColumn, direction);

        // Only apply applicationId filter, if one is given.
        queryBuilder = this.filterByApplication(query, queryBuilder, applicationIds);

        const [result, total] = await queryBuilder.getManyAndCount();

        return {
            data: result,
            count: total,
        };
    }
    private getSortingForMulticasts(query: ListAllMulticastsDto) {
        let orderBy = `multicast.id`;
        if (
            (query?.orderOn != null && query.orderOn == "id") ||
            query.orderOn == "groupName"
        ) {
            orderBy = `multicast.${query.orderOn}`;
        }
        return orderBy;
    }
    private filterByApplication(
        query: ListAllMulticastsDto,
        queryBuilder: SelectQueryBuilder<Multicast>,
        applicationIds: number[]
    ) {
        if (query.applicationId) {
            queryBuilder = queryBuilder.where("multicast.application = :appId", {
                appId: query.applicationId,
            });
        } else if (applicationIds) {
            queryBuilder = queryBuilder.where(
                '"application"."id" IN (:...allowedApplications)',
                {
                    allowedApplications: applicationIds,
                }
            );
        }
        return queryBuilder;
    }

    async findOne(id: number): Promise<Multicast> {
        return await this.multicastRepository.findOneOrFail({
            where: { id },
            relations: ["application", "lorawanMulticastDefinition", "iotDevices"],
            loadRelationIds: {
                relations: ["createdBy", "updatedBy"],
            },
        });
    }

    async create(
        createMulticastDto: CreateMulticastDto,
        userId: number
    ): Promise<Multicast> {
        //since the multicast is gonna be created in both the DB with relations and in chirpstack, two different objects is gonna be used.
        const dbMulticast = new Multicast();
        dbMulticast.lorawanMulticastDefinition = new LorawanMulticastDefinition();
        const chirpStackMulticast = new CreateMulticastChirpStackDto();
        chirpStackMulticast.multicastGroup = new ChirpstackMulticastContentsDto();

        const mappedDbMulticast = await this.mapMulticastDtoToDbMulticast(
            createMulticastDto,
            dbMulticast
        );
        mappedDbMulticast.createdBy = userId;
        mappedDbMulticast.updatedBy = userId;
        mappedDbMulticast.lorawanMulticastDefinition.createdBy = userId;
        mappedDbMulticast.lorawanMulticastDefinition.updatedBy = userId;

        if (!!createMulticastDto.iotDevices) {
            const lorawanDevices = this.checkForLorawan(createMulticastDto);
            if (lorawanDevices.length > 0) {
                if (await this.checkForDifferentAppID(lorawanDevices)) {
                    // If they all have same serviceID / appID then proceed.
                    await this.createMulticastInChirpstack(
                        createMulticastDto,
                        chirpStackMulticast,
                        lorawanDevices,
                        mappedDbMulticast
                    );
                } else {
                    throw new BadRequestException(ErrorCodes.DifferentServiceprofile);
                }
            }
        }
        return await this.multicastRepository.save(mappedDbMulticast);
    }

    async createMulticastInChirpstack(
        createMulticastDto: CreateMulticastDto | UpdateMulticastDto,
        chirpStackMulticast: CreateMulticastChirpStackDto,
        lorawanDevices: LoRaWANDevice[],
        mappedDbMulticast: Multicast
    ): Promise<void> {
        const mappedChirpStackMulticast = await this.mapMulticastDtoToChirpStackMulticast(
            createMulticastDto,
            chirpStackMulticast,
            lorawanDevices[0] // used for setting appID
        );

        const result = await this.post(this.multicastGroupUrl, mappedChirpStackMulticast); // This creates the multicast in chirpstack. Chirpstack returns an id as a string

        await this.addDevices(createMulticastDto, result); // iotDevices are added to multicast in a seperate endpoint.

        this.handlePossibleError(result, createMulticastDto);

        if (result.status === 200) {
            mappedDbMulticast.lorawanMulticastDefinition.chirpstackGroupId =
                result.data.id;
        }
    }

    async update(
        existingMulticast: Multicast,
        updateMulticastDto: UpdateMulticastDto,
        userId: number
    ): Promise<Multicast> {
        const oldMulticast: Multicast = { ...existingMulticast };
        const mappedMulticast = await this.mapMulticastDtoToDbMulticast(
            updateMulticastDto,
            existingMulticast
        );
        const lorawanDevices = this.checkForLorawan(updateMulticastDto);
        const oldLorawanDevices = this.checkForLorawan(oldMulticast);
        if (lorawanDevices.length > 0 || oldLorawanDevices.length > 0) {
            // check if new lorawan devices is included. If so, either create or update in chirpstack. Otherwise, just update db
            if (!existingMulticast.lorawanMulticastDefinition.chirpstackGroupId) {
                await this.createIfNotInChirpstack(
                    lorawanDevices,
                    updateMulticastDto,
                    mappedMulticast
                );
            } else {
                await this.updateLogic(
                    existingMulticast,
                    lorawanDevices,
                    updateMulticastDto,
                    oldMulticast
                );
            }
        }
        mappedMulticast.updatedBy = userId;
        return await this.multicastRepository.save(mappedMulticast);
    }

    async updateMulticastToChirpstack(
        updateMulticastDto: UpdateMulticastDto,
        existingChirpStackMulticast: CreateMulticastChirpStackDto,
        lorawanDevices: LoRaWANDevice[],
        existingMulticast: Multicast
    ): Promise<void> {
        const mappedChirpStackMulticast = await this.mapMulticastDtoToChirpStackMulticast(
            updateMulticastDto,
            existingChirpStackMulticast,
            lorawanDevices[0]
        );

        const result = await this.put(
            this.multicastGroupUrl,
            mappedChirpStackMulticast,
            existingMulticast.lorawanMulticastDefinition.chirpstackGroupId
        );
        this.handlePossibleError(result, updateMulticastDto);

        const added: IoTDevice[] = [];
        const removed: IoTDevice[] = [];
        this.compareDevices(existingMulticast, updateMulticastDto, added, removed);
        await this.updateDevices(
            // add's and removes devices from chirpstack
            removed,
            added,
            existingMulticast.lorawanMulticastDefinition.chirpstackGroupId
        );
    }

    checkForLorawan(
        multicastDto: CreateMulticastDto | Multicast | UpdateMulticastDto
    ): LoRaWANDevice[] {
        const lorawanDevices = multicastDto.iotDevices.filter(
            x => x.type === IoTDeviceType.LoRaWAN
        ) as LoRaWANDevice[];
        return lorawanDevices;
    }

    async validateNewDevicesAppID(
        chirpStackMulticast: CreateMulticastChirpStackDto,
        lorawanDevices: LoRaWANDevice[]
    ): Promise<boolean> {
        const devices: ChirpstackDeviceContentsDto[] = [];

        for (let index = 0; index < lorawanDevices.length; index++) {
            const lora = await this.chirpStackDeviceService.getChirpstackDevice(
                lorawanDevices[index].deviceEUI
            );
            devices.push(lora);
        }

        for (let i = 0; i < devices.length; i++) {
            if (
                devices[i].applicationID !==
                chirpStackMulticast.multicastGroup.applicationID
            ) {
                // if one of the application id is different than the first one, then we know that there is different
                // service profiles. Therefore, return false.
                return false;
            }
        }
        return true;
    }

    async checkForDifferentAppID(lorawanDevices: LoRaWANDevice[]): Promise<boolean> {
        const devices: ChirpstackDeviceContentsDto[] = [];

        for (let index = 0; index < lorawanDevices.length; index++) {
            const lora = await this.chirpStackDeviceService.getChirpstackDevice(
                lorawanDevices[index].deviceEUI
            );
            devices.push(lora);
        }
        if (devices.length > 0) {
            const appID: string = devices[0].applicationID; // In chirpstack, an application is made on each service profile. Because of that, it's enough to
            //check on AppID, instead of getting the application and then the service ID

            for (let i = 0; i < devices.length; i++) {
                if (devices[i].applicationID !== appID) {
                    // if one of the application id is different than the first one, then we know that there is different
                    // service profiles. Therefore, return false.
                    return false;
                }
            }
        }
        return true; // If the appId is equal for each element, then it's the same service profile
    }

    async getChirpstackMulticast(
        multicastId: string
    ): Promise<CreateMulticastChirpStackDto> {
        const res = await this.get<CreateMulticastChirpStackDto>(
            `multicast-groups/${multicastId}`
        );

        return res;
    }

    async multicastDelete(
        id: number,
        existingMulticast: Multicast
    ): Promise<DeleteResult> {
        const loraDevices = this.checkForLorawan(existingMulticast);
        if (loraDevices.length > 0) {
            await this.deleteMulticastChirpstack(
                existingMulticast.lorawanMulticastDefinition.chirpstackGroupId
            );
        }
        return this.multicastRepository.delete(id);
    }

    async deleteMulticastChirpstack(id: string): Promise<AxiosResponse> {
        try {
            return await this.delete(this.multicastGroupUrl, id);
        } catch (err) {
            throw err;
        }
    }

    private async mapMulticastDtoToDbMulticast(
        multicastDto: CreateMulticastDto | UpdateMulticastDto,
        multicast: Multicast
    ): Promise<Multicast> {
        multicast.groupName = multicastDto.name;
        multicast.lorawanMulticastDefinition.address = multicastDto.mcAddr;
        multicast.lorawanMulticastDefinition.applicationSessionKey =
            multicastDto.mcAppSKey;
        multicast.lorawanMulticastDefinition.networkSessionKey = multicastDto.mcNwkSKey;
        multicast.lorawanMulticastDefinition.dataRate = multicastDto.dr;
        multicast.lorawanMulticastDefinition.frameCounter = multicastDto.fCnt;
        multicast.lorawanMulticastDefinition.frequency = multicastDto.frequency;
        multicast.lorawanMulticastDefinition.groupType = multicastDto.groupType;
        multicast.iotDevices = multicastDto.iotDevices;

        if (multicastDto.applicationID !== null) {
            try {
                multicast.application = await this.applicationService.findOneWithoutRelations(
                    multicastDto.applicationID
                );
            } catch (err) {
                this.logger.error(
                    `Could not find application with id: ${multicastDto.applicationID}`
                );

                throw new BadRequestException(ErrorCodes.IdDoesNotExists);
            }
        } else {
            throw new BadRequestException(ErrorCodes.IdMissing);
        }

        return multicast;
    }

    private async mapMulticastDtoToChirpStackMulticast(
        multicastDto: CreateMulticastDto | UpdateMulticastDto,
        multicast: CreateMulticastChirpStackDto,
        device: LoRaWANDevice
    ): Promise<CreateMulticastChirpStackDto> {
        multicast.multicastGroup.name = multicastDto.name;
        multicast.multicastGroup.mcAddr = multicastDto.mcAddr;
        multicast.multicastGroup.mcAppSKey = multicastDto.mcAppSKey;
        multicast.multicastGroup.mcNwkSKey = multicastDto.mcNwkSKey;
        multicast.multicastGroup.dr = multicastDto.dr;
        multicast.multicastGroup.fCnt = multicastDto.fCnt;
        multicast.multicastGroup.frequency = multicastDto.frequency;
        multicast.multicastGroup.groupType = multicastDto.groupType;
        if (!!device) {
            // if devices is included, at this point we know that devices is validated. Therefore we can use appID
            multicast.multicastGroup.applicationID = device.chirpstackApplicationId.toString();
        } else {
            // used for update when all devices are removed
            multicast.multicastGroup.applicationID =
                multicast.multicastGroup.applicationID;
        }

        return multicast;
    }

    private handlePossibleError(
        result: AxiosResponse,
        dto:
            | CreateMulticastDto
            | UpdateMulticastDto
            | CreateChirpstackMulticastQueueItemDto
    ): void {
        if (result.status !== 200) {
            this.logger.error(
                `Error from Chirpstack: '${JSON.stringify(
                    dto
                )}', got response: ${JSON.stringify(result.data)}`
            );
            throw new BadRequestException({
                success: false,
                error: result.data,
            });
        }
    }

    private async updateDevices(
        removed: IoTDevice[],
        added: IoTDevice[],
        chirpstackMulticastID: string
    ) {
        removed.forEach(async device => {
            // if the removed devices is a lorawan, then delete from chirpstack
            if (device.type === IoTDeviceType.LoRaWAN) {
                let lorawanDevice: LoRaWANDevice = new LoRaWANDevice();
                lorawanDevice = device as LoRaWANDevice;
                return await this.delete(
                    this.multicastGroupUrl +
                        "/" +
                        chirpstackMulticastID +
                        "/" +
                        "devices",
                    lorawanDevice.deviceEUI
                );
            }
        });
        added.forEach(async device => {
            if (device.type === IoTDeviceType.LoRaWAN) {
                let lorawanDevice: LoRaWANDevice = new LoRaWANDevice();
                lorawanDevice = device as LoRaWANDevice;
                const addDevice = new AddDeviceToMulticastDto();
                addDevice.devEUI = lorawanDevice.deviceEUI;
                addDevice.multicastGroupID = chirpstackMulticastID;

                await this.post(
                    this.multicastGroupUrl +
                        "/" +
                        chirpstackMulticastID +
                        "/" +
                        "devices",
                    addDevice
                );
            }
        });
    }

    private async addDevices(
        multicastDto: CreateMulticastDto | UpdateMulticastDto,
        chirpstackMulticastID: AxiosResponse // the id returned from chirpstack when the multicast is created in chirpstack.
    ) {
        multicastDto.iotDevices.forEach(async device => {
            if (device.type === IoTDeviceType.LoRaWAN) {
                let lorawanDevice: LoRaWANDevice = new LoRaWANDevice();
                lorawanDevice = device as LoRaWANDevice; // cast to LoRaWANDevice since it has DeviceEUI
                const addDevice = new AddDeviceToMulticastDto();
                addDevice.devEUI = lorawanDevice.deviceEUI;
                addDevice.multicastGroupID = chirpstackMulticastID.data.id;

                await this.post(
                    // post call to chirpstack
                    this.multicastGroupUrl +
                        "/" +
                        chirpstackMulticastID.data.id +
                        "/" +
                        "devices",
                    addDevice
                );
            }
        });
    }

    private compareDevices(
        oldMulticast: Multicast,
        newMulticast: UpdateMulticastDto,
        added: IoTDevice[],
        removed: IoTDevice[]
    ) {
        oldMulticast.iotDevices.forEach(dbDevice => {
            // if a device in the old multicast is not in the new one, then delete
            if (
                newMulticast.iotDevices.findIndex(device => device.id === dbDevice.id) ===
                -1
            ) {
                removed.push(dbDevice);
            }
        });

        newMulticast.iotDevices.forEach(frontendDevice => {
            // if a device in the new multicast is not in the old one, then add
            if (
                oldMulticast.iotDevices.findIndex(
                    device => device.id === frontendDevice.id
                ) === -1
            ) {
                added.push(frontendDevice);
            }
        });
    }

    async getDownlinkQueue(
        multicastID: string
    ): Promise<MulticastDownlinkQueueResponseDto> {
        const res = await this.get<MulticastDownlinkQueueResponseDto>(
            `multicast-groups/${multicastID}/queue`
        );
        return res;
    }

    public async createDownlink(
        dto: CreateMulticastDownlinkDto,
        multicast: Multicast
    ): Promise<CreateChirpstackMulticastQueueItemResponse> {
        const csDto: CreateChirpstackMulticastQueueItemDto = {
            multicastQueueItem: {
                fPort: dto.port,
                multicastGroupID: multicast.lorawanMulticastDefinition.chirpstackGroupId,
                data: this.hexBytesToBase64(dto.data),
            },
        };

        try {
            return this.overwriteDownlink(csDto);
        } catch (err) {
            this.handlePossibleError(err, csDto);
        }
    }
    async overwriteDownlink(
        dto: CreateChirpstackMulticastQueueItemDto
    ): Promise<CreateChirpstackMulticastQueueItemResponse> {
        await this.deleteDownlinkQueue(dto.multicastQueueItem.multicastGroupID);
        try {
            const res = await this.post<CreateChirpstackMulticastQueueItemDto>(
                `multicast-groups/${dto.multicastQueueItem.multicastGroupID}/queue`,
                dto
            );
            return res.data;
        } catch (err) {
            const fcntError =
                "enqueue downlink payload error: get next downlink fcnt for deveui error";
            if (err?.response?.data?.error?.startsWith(fcntError)) {
                throw new BadRequestException(
                    ErrorCodes.DeviceIsNotActivatedInChirpstack
                );
            }

            throw err;
        }
    }
    async deleteDownlinkQueue(multicastID: string): Promise<void> {
        await this.delete(`multicast-groups/${multicastID}/queue`);
    }

    private hexBytesToBase64(hexBytes: string): string {
        return Buffer.from(hexBytes, "hex").toString("base64");
    }

    private async createIfNotInChirpstack(
        lorawanDevices: LoRaWANDevice[],
        updateMulticastDto: UpdateMulticastDto,
        mappedMulticast: Multicast
    ): Promise<void> {
        const chirpStackMulticast = new CreateMulticastChirpStackDto();
        chirpStackMulticast.multicastGroup = new ChirpstackMulticastContentsDto();

        if (await this.checkForDifferentAppID(lorawanDevices)) {
            await this.createMulticastInChirpstack(
                updateMulticastDto,
                chirpStackMulticast,
                lorawanDevices,
                mappedMulticast
            );
        } else {
            throw new BadRequestException(ErrorCodes.DifferentServiceprofile);
        }
    }

    private async updateLogic(
        existingMulticast: Multicast,
        lorawanDevices: LoRaWANDevice[],
        updateMulticastDto: UpdateMulticastDto,
        oldMulticast: Multicast
    ): Promise<void> {
        const existingChirpStackMulticast = await this.getChirpstackMulticast(
            existingMulticast.lorawanMulticastDefinition.chirpstackGroupId
        );
        if (await this.checkForDifferentAppID(lorawanDevices)) {
            if (
                await this.validateNewDevicesAppID(
                    // check if the new devices has the same service profile as the multicast.
                    existingChirpStackMulticast,
                    lorawanDevices
                )
            ) {
                await this.updateMulticastToChirpstack(
                    updateMulticastDto,
                    existingChirpStackMulticast,
                    lorawanDevices,
                    oldMulticast
                );
            } else {
                throw new BadRequestException(ErrorCodes.NewDevicesWrongServiceProfile);
            }
        } else {
            throw new BadRequestException(ErrorCodes.DifferentServiceprofile);
        }
    }
}
