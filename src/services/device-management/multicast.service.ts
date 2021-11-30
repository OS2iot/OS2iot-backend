import { CreateMulticastChirpStackDto } from "@dto/chirpstack/create-multicast-chirpstack.dto";
import { ListAllMulticastsResponseDto } from "@dto/list-all-multicasts-response.dto";
import { ListAllMulticastsDto } from "@dto/list-all-multicasts.dto";
import { Multicast } from "@entities/multicast.entity";
import { ErrorCodes } from "@enum/error-codes.enum";
import { BadRequestException, HttpService, Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { GenericChirpstackConfigurationService } from "@services/chirpstack/generic-chirpstack-configuration.service";
import { DeleteResult, getConnection, Repository, SelectQueryBuilder } from "typeorm";
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

@Injectable()
export class MulticastService extends GenericChirpstackConfigurationService {
    constructor(
        internalHttpService: HttpService,

        @InjectRepository(Multicast)
        private multicastRepository: Repository<Multicast>,
        private applicationService: ApplicationService
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
        let queryBuilder = getConnection()
            .getRepository(Multicast)
            .createQueryBuilder("multicast")
            .innerJoinAndSelect("multicast.application", "application")
            .innerJoinAndSelect(
                "multicast.lorawanMulticastDefinition",
                "lorawan-multicast"
            )
            .limit(query.limit)
            .offset(query.offset)
            .orderBy(query.orderOn, "ASC");

        // Only apply applicationId filter, if one is given.
        queryBuilder = this.filterByApplication(query, queryBuilder, applicationIds);

        const [result, total] = await queryBuilder.getManyAndCount();

        return {
            data: result,
            count: total,
        };
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
        return await this.multicastRepository.findOneOrFail(id, {
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
        const dbMulticast = new Multicast(); // to db
        dbMulticast.lorawanMulticastDefinition = new LorawanMulticastDefinition();
        const chirpStackMulticast = new CreateMulticastChirpStackDto(); // to chirpstack. The chirpStackMulticast contains the contentsDto.
        chirpStackMulticast.multicastGroup = new ChirpstackMulticastContentsDto();

        const mappedDbMulticast = await this.mapMulticastDtoToDbMulticast(
            // map to db object
            createMulticastDto,
            dbMulticast
        );

        const mappedChirpStackMulticast = await this.mapMulticastDtoToChirpStackMulticast(
            // map to chirpstack object.
            createMulticastDto,
            chirpStackMulticast
        );

        mappedDbMulticast.createdBy = userId;
        mappedDbMulticast.updatedBy = userId;
        mappedDbMulticast.lorawanMulticastDefinition.createdBy = userId;
        mappedDbMulticast.lorawanMulticastDefinition.updatedBy = userId;

        const result = await this.post(this.multicastGroupUrl, mappedChirpStackMulticast); // This creates the multicast in chirpstack. Chirpstack creates the Id as a string

        await this.addDevices(createMulticastDto, result); // iotDevices is added in a seperate endpoint.

        this.handlePossibleError(result, createMulticastDto); // if chirpstack fails the multicast post call, this will throw exception

        // if post is succesful then id should be created. This id is also used for the db object so that they have the same Id.
        if (result.status === 200) {
            mappedDbMulticast.lorawanMulticastDefinition.chirpstackGroupId =
                result.data.id;
            return await this.multicastRepository.save(mappedDbMulticast); // save to db
        }
    }

    async update(
        id: number,
        updateMulticastDto: UpdateMulticastDto,
        userId: number
    ): Promise<Multicast> {
        const existingMulticast = await this.findOne(id); // finds the existing multicast from db
        const added: IoTDevice[] = [];
        const removed: IoTDevice[] = [];
        this.compareDevices(existingMulticast, updateMulticastDto, added, removed); // compares the new and old multicast

        const mappedMulticast = await this.mapMulticastDtoToDbMulticast(
            updateMulticastDto,
            existingMulticast
        );
        const existingChirpStackMulticast = await this.getChirpstackMulticast(
            // get's the existing multicast in chirpstack by id
            existingMulticast.lorawanMulticastDefinition.chirpstackGroupId
        );
        const mappedChirpStackMulticast = await this.mapMulticastDtoToChirpStackMulticast(
            updateMulticastDto,
            existingChirpStackMulticast
        );
        const result = await this.put(
            // updates in chirpstack.
            this.multicastGroupUrl,
            mappedChirpStackMulticast,
            existingMulticast.lorawanMulticastDefinition.chirpstackGroupId
        );
        await this.updateDevices(
            // add's and removes devices from chirpstack
            removed,
            added,
            existingMulticast.lorawanMulticastDefinition.chirpstackGroupId
        );
        this.handlePossibleError(result, updateMulticastDto);
        if (result.status === 200) {
            mappedMulticast.updatedBy = userId;
            return await this.multicastRepository.save(mappedMulticast); // saves in db
        }
    }

    async getChirpstackMulticast(
        multicastId: string
    ): Promise<CreateMulticastChirpStackDto> {
        const res = await this.get<CreateMulticastChirpStackDto>( // get's multicast from chirpstack by id
            `multicast-groups/${multicastId}`
        );

        return res;
    }

    async multicastDelete(id: number): Promise<DeleteResult> {
        // deletes multicast in both chirpstack and multicast by id
        const existingMulticast = await this.findOne(id); // finds existing multicast in db by id.
        const result = await this.deleteMulticastChirpstack(
            existingMulticast.lorawanMulticastDefinition.chirpstackGroupId
        );
        if (result.status === 200) {
            return this.multicastRepository.delete(id);
        }
    }

    async deleteMulticastChirpstack(id: string): Promise<AxiosResponse> {
        try {
            return await this.delete(this.multicastGroupUrl, id); // deletes in chirpstack by id
        } catch (err) {
            throw err;
        }
    }

    private async mapMulticastDtoToDbMulticast(
        // maps the incoming dto to db object.
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

        if (multicastDto.applicationID != null) {
            try {
                multicast.application = await this.applicationService.findOneWithoutRelations(
                    // maps to application by id
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
        // maps incoming dto to chirpstack object
        multicastDto: CreateMulticastDto | UpdateMulticastDto,
        multicast: CreateMulticastChirpStackDto
    ): Promise<CreateMulticastChirpStackDto> {
        multicast.multicastGroup.name = multicastDto.name;
        multicast.multicastGroup.mcAddr = multicastDto.mcAddr;
        multicast.multicastGroup.mcAppSKey = multicastDto.mcAppSKey;
        multicast.multicastGroup.mcNwkSKey = multicastDto.mcNwkSKey;
        multicast.multicastGroup.dr = multicastDto.dr;
        multicast.multicastGroup.fCnt = multicastDto.fCnt;
        multicast.multicastGroup.frequency = multicastDto.frequency;
        multicast.multicastGroup.groupType = multicastDto.groupType;
        multicast.multicastGroup.applicationID = "1"; // chirpstack can only have one application, and that application has id = 1 - therefore hardcoded here.

        return multicast;
    }

    private handlePossibleError(
        result: AxiosResponse,
        dto: CreateMulticastDto | UpdateMulticastDto
    ): void {
        if (result.status != 200) {
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
            // if the added devices is a lorawan then add to chirpstack
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
        multicastDto: CreateMulticastDto,
        chirpstackMulticastID: AxiosResponse // the id returned from chirpstack when the multicast is created in chirpstack.
    ) {
        multicastDto.iotDevices.forEach(async device => {
            if (device.type === IoTDeviceType.LoRaWAN) {
                // if the device type is LoRaWAN, then it should be send to chirpstack
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
                newMulticast.iotDevices.findIndex(device => device.id == dbDevice.id) ===
                -1
            ) {
                removed.push(dbDevice);
            }
        });

        newMulticast.iotDevices.forEach(frontendDevice => {
            // if a device in the new multicast is not in the old one, then add
            if (
                oldMulticast.iotDevices.findIndex(
                    device => device.id == frontendDevice.id
                ) === -1
            ) {
                added.push(frontendDevice);
            }
        });
    }
}
