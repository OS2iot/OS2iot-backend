import { CreateMulticastChirpStackDto } from "@dto/chirpstack/create-multicast-chirpstack.dto";
import { ListAllMulticastsResponseDto } from "@dto/list-all-multicasts-response.dto";
import { ListAllMulticastsDto } from "@dto/list-all-multicasts.dto";
import { Multicast } from "@entities/multicast.entity";
import { ErrorCodes } from "@enum/error-codes.enum";
import { BadRequestException, forwardRef, Inject, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { GenericChirpstackConfigurationService } from "@services/chirpstack/generic-chirpstack-configuration.service";
import { DeleteResult, Repository, SelectQueryBuilder } from "typeorm";
import { CreateMulticastDto } from "../../entities/dto/create-multicast.dto";
import { UpdateMulticastDto } from "../../entities/dto/update-multicast.dto";
import { ApplicationService } from "../device-management/application.service";
import { ChirpstackMulticastContentsDto } from "@dto/chirpstack/chirpstack-multicast-contents.dto";
import { LorawanMulticastDefinition } from "@entities/lorawan-multicast.entity";
import { IoTDeviceType } from "@enum/device-type.enum";
import { AddDeviceToMulticastDto } from "@dto/chirpstack-add-device-multicast.dto";
import { LoRaWANDevice } from "@entities/lorawan-device.entity";
import { IoTDevice } from "@entities/iot-device.entity";
import {
    MulticastDownlinkQueueResponseDto,
    MulticastQueueItem,
} from "@dto/chirpstack/chirpstack-multicast-downlink-queue-response.dto";
import { CreateMulticastDownlinkDto } from "@dto/create-multicast-downlink.dto";
import {
    CreateChirpstackMulticastQueueItemDto,
    CreateChirpstackMulticastQueueItemResponse,
} from "@dto/chirpstack/create-chirpstack-multicast-queue-item.dto";
import { ChirpstackDeviceService } from "@services/chirpstack/chirpstack-device.service";
import { ChirpstackDeviceContentsDto } from "@dto/chirpstack/chirpstack-device-contents.dto";
import {
    AddDeviceToMulticastGroupRequest,
    CreateMulticastGroupRequest,
    DeleteMulticastGroupRequest,
    EnqueueMulticastGroupQueueItemRequest,
    FlushMulticastGroupQueueRequest,
    GetMulticastGroupRequest,
    GetMulticastGroupResponse,
    ListMulticastGroupQueueRequest,
    ListMulticastGroupQueueResponse,
    MulticastGroup,
    MulticastGroupQueueItem,
    MulticastGroupType,
    UpdateMulticastGroupRequest,
} from "@chirpstack/chirpstack-api/api/multicast_group_pb";
import { MulticastGroupServiceClient } from "@chirpstack/chirpstack-api/api/multicast_group_grpc_pb";
import { ServiceError } from "@grpc/grpc-js";
import { IdResponse } from "@interfaces/chirpstack-id-response.interface";
import { multicastGroup } from "@enum/multicast-type.enum";
@Injectable()
export class MulticastService extends GenericChirpstackConfigurationService {
    constructor(
        @InjectRepository(Multicast)
        private multicastRepository: Repository<Multicast>,
        @Inject(forwardRef(() => ApplicationService)) // because of circular reference
        private applicationService: ApplicationService,
        private chirpStackDeviceService: ChirpstackDeviceService
    ) {
        super();
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
            .innerJoinAndSelect("multicast.lorawanMulticastDefinition", "lorawan-multicast")
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
        if ((query?.orderOn != null && query.orderOn == "id") || query.orderOn == "groupName") {
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
            queryBuilder = queryBuilder.where('"application"."id" IN (:...allowedApplications)', {
                allowedApplications: applicationIds,
            });
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

    async create(createMulticastDto: CreateMulticastDto, userId: number): Promise<Multicast> {
        //since the multicast is gonna be created in both the DB with relations and in chirpstack, two different objects is gonna be used.
        const dbMulticast = new Multicast();
        dbMulticast.lorawanMulticastDefinition = new LorawanMulticastDefinition();

        const mappedDbMulticast = await this.mapMulticastDtoToDbMulticast(createMulticastDto, dbMulticast);
        mappedDbMulticast.createdBy = userId;
        mappedDbMulticast.updatedBy = userId;
        mappedDbMulticast.lorawanMulticastDefinition.createdBy = userId;
        mappedDbMulticast.lorawanMulticastDefinition.updatedBy = userId;

        if (!!createMulticastDto.iotDevices) {
            const lorawanDevices = this.checkForLorawan(createMulticastDto);
            if (lorawanDevices.length > 0) {
                if (await this.checkForDifferentAppID(lorawanDevices)) {
                    // If they all have same serviceID / appID then proceed.
                    await this.createMulticastInChirpstack(createMulticastDto, lorawanDevices, mappedDbMulticast);
                } else {
                    throw new BadRequestException(ErrorCodes.InvalidPost);
                }
            }
        }
        return await this.multicastRepository.save(mappedDbMulticast);
    }

    async createMulticastInChirpstack(
        createMulticastDto: CreateMulticastDto | UpdateMulticastDto,
        lorawanDevices: LoRaWANDevice[],
        mappedDbMulticast: Multicast
    ): Promise<void> {
        const mappedChirpStackMulticast = await this.mapMulticastDtoToChirpStackMulticast(
            createMulticastDto,
            lorawanDevices[0] // used for setting appID
        );
        const req = new CreateMulticastGroupRequest();
        req.setMulticastGroup(mappedChirpStackMulticast);
        const result: IdResponse = await this.post(this.multicastGroupUrl, this.multicastServiceClient, req); // This creates the multicast in chirpstack. Chirpstack returns an id as a string

        await this.addDevices(createMulticastDto, result); // iotDevices are added to multicast in a seperate endpoint.

        this.handlePossibleError(result, createMulticastDto);

        if (result.id) {
            mappedDbMulticast.lorawanMulticastDefinition.chirpstackGroupId = result.id;
        }
    }

    async update(
        existingMulticast: Multicast,
        updateMulticastDto: UpdateMulticastDto,
        userId: number
    ): Promise<Multicast> {
        const oldMulticast: Multicast = { ...existingMulticast };
        const mappedMulticast = await this.mapMulticastDtoToDbMulticast(updateMulticastDto, existingMulticast);
        const lorawanDevices = this.checkForLorawan(updateMulticastDto);
        const oldLorawanDevices = this.checkForLorawan(oldMulticast);
        if (lorawanDevices.length > 0 || oldLorawanDevices.length > 0) {
            // check if new lorawan devices is included. If so, either create or update in chirpstack. Otherwise, just update db
            if (!existingMulticast.lorawanMulticastDefinition.chirpstackGroupId) {
                await this.createIfNotInChirpstack(lorawanDevices, updateMulticastDto, mappedMulticast);
            } else {
                await this.updateLogic(existingMulticast, lorawanDevices, updateMulticastDto, oldMulticast);
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
            lorawanDevices[0]
        );
        mappedChirpStackMulticast.setId(existingChirpStackMulticast.multicastGroup.id);
        const req = new UpdateMulticastGroupRequest();
        req.setMulticastGroup(mappedChirpStackMulticast);
        try {
            await this.put(this.multicastGroupUrl, this.multicastServiceClient, req);

            const added: IoTDevice[] = [];
            const removed: IoTDevice[] = [];
            this.compareDevices(existingMulticast, updateMulticastDto, added, removed);
            await this.updateDevices(
                // add's and removes devices from chirpstack
                removed,
                added,
                existingMulticast.lorawanMulticastDefinition.chirpstackGroupId
            );
        } catch (e) {
            throw new BadRequestException(e);
        }
    }

    checkForLorawan(multicastDto: CreateMulticastDto | Multicast | UpdateMulticastDto): LoRaWANDevice[] {
        const lorawanDevices = multicastDto.iotDevices.filter(x => x.type === IoTDeviceType.LoRaWAN) as LoRaWANDevice[];
        return lorawanDevices;
    }

    async validateNewDevicesAppID(
        chirpStackMulticast: CreateMulticastChirpStackDto,
        lorawanDevices: LoRaWANDevice[]
    ): Promise<boolean> {
        const devices: ChirpstackDeviceContentsDto[] = [];

        for (let index = 0; index < lorawanDevices.length; index++) {
            const lora = await this.chirpStackDeviceService.getChirpstackDevice(lorawanDevices[index].deviceEUI);
            devices.push(lora);
        }

        for (let i = 0; i < devices.length; i++) {
            if (devices[i].applicationID !== chirpStackMulticast.multicastGroup.applicationID) {
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
            const lora = await this.chirpStackDeviceService.getChirpstackDevice(lorawanDevices[index].deviceEUI);
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

    async getChirpstackMulticast(multicastId: string): Promise<CreateMulticastChirpStackDto> {
        const req = new GetMulticastGroupRequest();
        req.setId(multicastId);
        const res = await this.get<GetMulticastGroupResponse>(
            `multicast-groups/${multicastId}`,
            this.multicastServiceClient,
            req
        );

        const multicastDtoContent: ChirpstackMulticastContentsDto = {
            applicationID: res.getMulticastGroup().getApplicationId(),
            dr: res.getMulticastGroup().getDr(),
            fCnt: res.getMulticastGroup().getFCnt(),
            frequency: res.getMulticastGroup().getFrequency(),
            mcAddr: res.getMulticastGroup().getMcAddr(),
            mcAppSKey: res.getMulticastGroup().getMcAppSKey(),
            mcNwkSKey: res.getMulticastGroup().getMcNwkSKey(),
            name: res.getMulticastGroup().getName(),
            groupType: multicastGroup.ClassC,
            id: res.getMulticastGroup().getId(),
        };

        const returnDto: CreateMulticastChirpStackDto = { multicastGroup: multicastDtoContent };

        return returnDto;
    }

    async multicastDelete(id: number, existingMulticast: Multicast): Promise<DeleteResult> {
        const loraDevices = this.checkForLorawan(existingMulticast);
        if (loraDevices.length > 0) {
            await this.deleteMulticastChirpstack(existingMulticast.lorawanMulticastDefinition.chirpstackGroupId);
        }
        return this.multicastRepository.delete(id);
    }

    async deleteMulticastChirpstack(id: string): Promise<void> {
        try {
            const req = new DeleteMulticastGroupRequest();
            req.setId(id);
            return await this.delete(this.multicastGroupUrl, this.multicastServiceClient, req);
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
        multicast.lorawanMulticastDefinition.applicationSessionKey = multicastDto.mcAppSKey;
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
                this.logger.error(`Could not find application with id: ${multicastDto.applicationID}`);

                throw new BadRequestException(ErrorCodes.IdDoesNotExists);
            }
        } else {
            throw new BadRequestException(ErrorCodes.IdMissing);
        }

        return multicast;
    }

    private async mapMulticastDtoToChirpStackMulticast(
        multicastDto: CreateMulticastDto | UpdateMulticastDto,
        device: LoRaWANDevice
    ): Promise<MulticastGroup> {
        const multicast = new MulticastGroup();

        multicast.setName(multicastDto.name);
        multicast.setMcAddr(multicastDto.mcAddr);
        multicast.setMcAppSKey(multicastDto.mcAppSKey);
        multicast.setMcNwkSKey(multicastDto.mcNwkSKey);
        multicast.setDr(multicastDto.dr);
        multicast.setFCnt(multicastDto.fCnt);
        multicast.setFrequency(multicastDto.frequency);
        multicast.setGroupType(MulticastGroupType.CLASS_C);
        if (!!device) {
            // if devices is included, at this point we know that devices is validated. Therefore we can use appID
            multicast.setApplicationId(device.chirpstackApplicationId.toString());
        } else {
            // used for update when all devices are removed
            multicast.setApplicationId(multicast.getApplicationId());
        }

        return multicast;
    }

    private handlePossibleError(
        result: IdResponse,
        dto: CreateMulticastDto | UpdateMulticastDto | CreateChirpstackMulticastQueueItemDto
    ): void {
        if (!result.id) {
            this.logger.error(`Error from Chirpstack: '${JSON.stringify(dto)}', failed`);
            throw new BadRequestException({
                success: false,
                error: result.id,
            });
        }
    }

    private async updateDevices(removed: IoTDevice[], added: IoTDevice[], chirpstackMulticastID: string) {
        removed.forEach(async device => {
            // if the removed devices is a lorawan, then delete from chirpstack
            if (device.type === IoTDeviceType.LoRaWAN) {
                let lorawanDevice: LoRaWANDevice = new LoRaWANDevice();
                lorawanDevice = device as LoRaWANDevice;
                return await this.delete(
                    this.multicastGroupUrl + "/" + chirpstackMulticastID + "/" + "devices",
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

                await this.post(this.multicastGroupUrl + "/" + chirpstackMulticastID + "/" + "devices", addDevice);
            }
        });
    }

    private async addDevices(
        multicastDto: CreateMulticastDto | UpdateMulticastDto,
        chirpstackMulticastID: IdResponse // the id returned from chirpstack when the multicast is created in chirpstack.
    ) {
        multicastDto.iotDevices.forEach(async device => {
            if (device.type === IoTDeviceType.LoRaWAN) {
                let lorawanDevice: LoRaWANDevice = new LoRaWANDevice();
                lorawanDevice = device as LoRaWANDevice; // cast to LoRaWANDevice since it has DeviceEUI
                const req = new AddDeviceToMulticastGroupRequest();
                req.setDevEui(lorawanDevice.deviceEUI);
                req.setMulticastGroupId(chirpstackMulticastID.id);

                await this.addDeviceToMulticast(
                    this.multicastGroupUrl + "/" + chirpstackMulticastID.id + "/" + "devices",
                    this.multicastServiceClient,
                    req
                );
            }
        });
    }

    async addDeviceToMulticast(
        endpoint: string,
        client?: MulticastGroupServiceClient,
        request?: AddDeviceToMulticastGroupRequest
    ): Promise<any> {
        const metaData = this.makeMetadataHeader();
        const createPromise = new Promise<IdResponse>((resolve, reject) => {
            client.addDevice(request, metaData, (err: ServiceError, resp: any) => {
                if (err) {
                    reject(err);
                } else {
                    this.logger.debug(`post:${endpoint} success`);
                    resolve(resp.toObject());
                }
            });
        });
        try {
            return await createPromise;
        } catch (err) {
            this.logger.error(`POST ${endpoint} got error: ${err}`);
            throw new BadRequestException();
        }
    }

    private compareDevices(
        oldMulticast: Multicast,
        newMulticast: UpdateMulticastDto,
        added: IoTDevice[],
        removed: IoTDevice[]
    ) {
        oldMulticast.iotDevices.forEach(dbDevice => {
            // if a device in the old multicast is not in the new one, then delete
            if (newMulticast.iotDevices.findIndex(device => device.id === dbDevice.id) === -1) {
                removed.push(dbDevice);
            }
        });

        newMulticast.iotDevices.forEach(frontendDevice => {
            // if a device in the new multicast is not in the old one, then add
            if (oldMulticast.iotDevices.findIndex(device => device.id === frontendDevice.id) === -1) {
                added.push(frontendDevice);
            }
        });
    }

    async getDownlinkQueue(multicastID: string): Promise<MulticastDownlinkQueueResponseDto> {
        const req = new ListMulticastGroupQueueRequest();
        req.setMulticastGroupId(multicastID);
        const res = await this.getQueue(this.multicastServiceClient, req);

        const queueDto: MulticastQueueItem[] = [];
        res.getItemsList().forEach(queueItem => {
            queueDto.push({
                multicastGroupId: queueItem.getMulticastGroupId(),
                fCnt: queueItem.getFCnt(),
                fPort: queueItem.getFPort(),
                data: queueItem.getData_asB64(),
            });
        });

        const responseDto: MulticastDownlinkQueueResponseDto = {
            deviceQueueItems: queueDto,
        };
        return responseDto;
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
            const req = new EnqueueMulticastGroupQueueItemRequest();
            const queueItem = new MulticastGroupQueueItem();
            queueItem.setData(dto.multicastQueueItem.data);
            queueItem.setMulticastGroupId(dto.multicastQueueItem.multicastGroupID);
            queueItem.setFPort(dto.multicastQueueItem.fPort);
            req.setQueueItem(queueItem);

            const res = await this.postDownlink(this.multicastServiceClient, req);
            return res;
        } catch (err) {
            const fcntError = "enqueue downlink payload error: get next downlink fcnt for deveui error";
            if (err?.response?.data?.error?.startsWith(fcntError)) {
                throw new BadRequestException(ErrorCodes.DeviceIsNotActivatedInChirpstack);
            }

            throw err;
        }
    }
    async deleteDownlinkQueue(multicastID: string): Promise<void> {
        const req = new FlushMulticastGroupQueueRequest();
        req.setMulticastGroupId(multicastID);
        await this.deleteQueue(this.multicastServiceClient, req);
    }

    private hexBytesToBase64(hexBytes: string): string {
        return Buffer.from(hexBytes, "hex").toString("base64");
    }

    private async createIfNotInChirpstack(
        lorawanDevices: LoRaWANDevice[],
        updateMulticastDto: UpdateMulticastDto,
        mappedMulticast: Multicast
    ): Promise<void> {
        if (await this.checkForDifferentAppID(lorawanDevices)) {
            await this.createMulticastInChirpstack(updateMulticastDto, lorawanDevices, mappedMulticast);
        } else {
            throw new BadRequestException(ErrorCodes.InvalidPost);
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
                throw new BadRequestException(ErrorCodes.InvalidPost);
            }
        } else {
            throw new BadRequestException(ErrorCodes.InvalidPost);
        }
    }

    async getQueue(
        client: MulticastGroupServiceClient,
        request: ListMulticastGroupQueueRequest
    ): Promise<ListMulticastGroupQueueResponse> {
        const metaData = this.makeMetadataHeader();
        const getPromise = new Promise<ListMulticastGroupQueueResponse>((resolve, reject) => {
            client.listQueue(request, metaData, (err: ServiceError, resp: any) => {
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

    async deleteQueue(client: MulticastGroupServiceClient, request: FlushMulticastGroupQueueRequest): Promise<void> {
        const metaData = this.makeMetadataHeader();
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
        client: MulticastGroupServiceClient,
        request: EnqueueMulticastGroupQueueItemRequest
    ): Promise<CreateChirpstackMulticastQueueItemResponse> {
        const metaData = this.makeMetadataHeader();
        const createPromise = new Promise<CreateChirpstackMulticastQueueItemResponse>((resolve, reject) => {
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
}
