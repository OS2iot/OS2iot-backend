import {
    Injectable,
    BadRequestException,
    Logger,
    NotFoundException,
} from "@nestjs/common";
import { IoTDevice } from "@entities/iot-device.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, DeleteResult, getManager } from "typeorm";
import { CreateIoTDeviceDto } from "@dto/create-iot-device.dto";
import { iotDeviceTypeMap } from "@enum/device-type-mapping";
import { ApplicationService } from "@services/application.service";
import { UpdateIoTDeviceDto } from "@dto/update-iot-device.dto";
import { Point } from "geojson";
import { GenericHTTPDevice } from "@entities/generic-http-device.entity";
import { LoRaWANDevice } from "@entities/lorawan-device.entity";
import { ChirpstackDeviceService } from "./chirpstack/chirpstack-device.service";
import { ActivationType } from "@enum/lorawan-activation-type.enum";
import { ErrorCodes } from "@entities/enum/error-codes.enum";
import { IoTDeviceType } from "@enum/device-type.enum";
import { LoRaWANDeviceWithChirpstackDataDto } from "@dto/lorawan-device-with-chirpstack-data.dto";

@Injectable()
export class IoTDeviceService {
    constructor(
        @InjectRepository(GenericHTTPDevice)
        private genericHTTPDeviceRepository: Repository<GenericHTTPDevice>,
        @InjectRepository(IoTDevice)
        private iotDeviceRepository: Repository<IoTDevice>,
        @InjectRepository(LoRaWANDevice)
        private loRaWANDeviceRepository: Repository<LoRaWANDevice>,
        private applicationService: ApplicationService,
        private chirpstackDeviceService: ChirpstackDeviceService
    ) {}
    private readonly logger = new Logger(IoTDeviceService.name);

    /*
    async findAndCountWithPagination(
        query?: ListAllIoTDevicesDto
    ): Promise<ListAllIoTDevicesReponseDto> {
        const [result, total] = await this.iotDeviceRepository.findAndCount({
            where: {},
            take: query.offset,
            skip: query.offset,
        });

        return {
            data: result,
            count: total,
        };
    }
    */

    async findOne(id: number): Promise<IoTDevice> {
        return await this.iotDeviceRepository.findOneOrFail(id, {
            relations: ["application"],
        });
    }

    async findOneWithApplicationAndMetadata(
        id: number
    ): Promise<IoTDevice | LoRaWANDeviceWithChirpstackDataDto> {
        // Repository syntax doesn't yet support ordering by relation: https://github.com/typeorm/typeorm/issues/2620
        // Therefore we use the QueryBuilder ...
        const iotDevice = await this.iotDeviceRepository
            .createQueryBuilder("iot_device")
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
            .orderBy('metadata."sentTime"', "DESC")
            .getOne();

        if (iotDevice == null) {
            throw new NotFoundException();
        }

        if (iotDevice.type == IoTDeviceType.LoRaWAN) {
            // Add more suplimental info about LoRaWAN devices.
            const loraDevice = iotDevice as LoRaWANDeviceWithChirpstackDataDto;
            loraDevice.lorawanSettings = await this.chirpstackDeviceService.getChirpstackDevice(
                loraDevice.deviceEUI
            );
            const csAppliation = await this.chirpstackDeviceService.getChirpstackApplication(
                loraDevice.lorawanSettings.applicationID
            );
            loraDevice.lorawanSettings.serviceProfileID =
                csAppliation.application.serviceProfileID;
            return loraDevice;
        }

        return iotDevice;
    }

    async findGenericHttpDeviceByApiKey(
        key: string
    ): Promise<GenericHTTPDevice> {
        return await this.genericHTTPDeviceRepository.findOne({ apiKey: key });
    }

    async findLoRaWANDeviceByDeviceEUI(
        deviceEUI: string
    ): Promise<LoRaWANDevice> {
        return await this.loRaWANDeviceRepository.findOne({
            deviceEUI: deviceEUI.toUpperCase(),
        });
    }

    async create(createIoTDeviceDto: CreateIoTDeviceDto): Promise<IoTDevice> {
        const childType = iotDeviceTypeMap[createIoTDeviceDto.type];
        const iotDevice = new childType();

        const mappedIotDevice = await this.mapDtoToIoTDevice(
            createIoTDeviceDto,
            iotDevice
        );

        const entityManager = getManager();
        return entityManager.save(mappedIotDevice);
    }

    async update(
        id: number,
        updateDto: UpdateIoTDeviceDto
    ): Promise<IoTDevice> {
        const existingIoTDevice = await this.iotDeviceRepository.findOneOrFail(
            id
        );

        const mappedIoTDevice = await this.mapDtoToIoTDevice(
            updateDto,
            existingIoTDevice
        );

        const res = this.iotDeviceRepository.save(mappedIoTDevice);

        return res;
    }

    async delete(id: number): Promise<DeleteResult> {
        return this.iotDeviceRepository.delete(id);
    }

    private async mapDtoToIoTDevice(
        createIoTDeviceDto: CreateIoTDeviceDto,
        iotDevice: IoTDevice
    ): Promise<IoTDevice> {
        iotDevice.name = createIoTDeviceDto.name;

        if (createIoTDeviceDto.applicationId != null) {
            iotDevice.application = await this.applicationService.findOneWithoutRelations(
                createIoTDeviceDto.applicationId
            );
        } else {
            iotDevice.application = null;
        }

        if (
            createIoTDeviceDto.longitude != null &&
            createIoTDeviceDto.latitude != null
        ) {
            iotDevice.location = {
                type: "Point",
                coordinates: [
                    createIoTDeviceDto.longitude,
                    createIoTDeviceDto.latitude,
                ],
            } as Point;
        } else {
            iotDevice.location = null;
        }

        iotDevice.comment = createIoTDeviceDto.comment;
        iotDevice.commentOnLocation = createIoTDeviceDto.commentOnLocation;
        iotDevice.metadata = createIoTDeviceDto.metadata;

        iotDevice = await this.mapChildDtoToIoTDevice(
            createIoTDeviceDto,
            iotDevice
        );

        return iotDevice;
    }

    private async mapChildDtoToIoTDevice(
        dto: CreateIoTDeviceDto,
        iotDevice: IoTDevice
    ): Promise<IoTDevice> {
        if (iotDevice.constructor.name === LoRaWANDevice.name) {
            const cast = <LoRaWANDevice>iotDevice;
            const loraDevice = await this.mapLoRaWANDevice(dto, cast);

            return <IoTDevice>loraDevice;
        }

        return iotDevice;
    }

    private async mapLoRaWANDevice(
        dto: CreateIoTDeviceDto,
        lorawanDevice: LoRaWANDevice
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

            await this.chirpstackDeviceService.createOrUpdateDevice(
                chirpstackDeviceDto
            );

            await this.doActivation(dto);
        } catch (err) {
            this.logger.error(err);
            throw new BadRequestException(
                "Could not create device in Chirpstack",
                err
            );
        }

        return lorawanDevice;
    }

    private async doActivation(dto: CreateIoTDeviceDto): Promise<void> {
        if (dto.lorawanSettings.activationType == ActivationType.OTAA) {
            // OTAA Activate if key is provided
            if (dto.lorawanSettings.OTAAapplicationKey) {
                await this.chirpstackDeviceService.activateDeviceWithOTAA(
                    dto.lorawanSettings.devEUI,
                    dto.lorawanSettings.OTAAapplicationKey
                );
            } else {
                throw new BadRequestException(ErrorCodes.MissingOTAAInfo);
            }
        } else if (dto.lorawanSettings.activationType == ActivationType.ABP) {
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
                    dto.lorawanSettings.applicationSessionKey
                );
            } else {
                throw new BadRequestException(ErrorCodes.MissingABPInfo);
            }
        }
    }
}
