import { Injectable, Logger } from "@nestjs/common";
import { IoTDevice } from "@entities/iot-device.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, DeleteResult, getManager } from "typeorm";
import { CreateIoTDeviceDto } from "@dto/create-iot-device.dto";
import { iotDeviceTypeMap } from "@enum/device-type-mapping";
import { ApplicationService } from "@services/application.service";
import { UpdateIoTDeviceDto } from "@dto/update-iot-device.dto";
import { Point } from "geojson";
import { GenericHTTPDevice } from "@entities/generic-http-device.entity";

@Injectable()
export class IoTDeviceService {
    constructor(
        @InjectRepository(GenericHTTPDevice)
        private genericHTTPDeviceRepository: Repository<GenericHTTPDevice>,
        @InjectRepository(IoTDevice)
        private iotDeviceRepository: Repository<IoTDevice>,
        private applicationService: ApplicationService
    ) {}

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

    async isApiKeyValid(key: string): Promise<boolean> {
        const count = await this.genericHTTPDeviceRepository.count({
            apiKey: key,
        });
        return count > 0;
    }

    async create(createIoTDeviceDto: CreateIoTDeviceDto): Promise<IoTDevice> {
        const childType = iotDeviceTypeMap[createIoTDeviceDto.type];
        const iotDevice = this.createIoTDeviceByDto(childType);

        const mappedIoTDevice = await this.mapIoTDeviceDtoToIoTDevice(
            createIoTDeviceDto,
            iotDevice
        );

        const entityManager = getManager();
        return entityManager.save(mappedIoTDevice);
    }

    async update(
        id: number,
        updateDto: UpdateIoTDeviceDto
    ): Promise<IoTDevice> {
        const existingIoTDevice = await this.iotDeviceRepository.findOneOrFail(
            id
        );

        const mappedIoTDevice = await this.mapIoTDeviceDtoToIoTDevice(
            updateDto,
            existingIoTDevice
        );

        const res = this.iotDeviceRepository.save(mappedIoTDevice);

        return res;
    }

    async delete(id: number): Promise<DeleteResult> {
        return this.iotDeviceRepository.delete(id);
    }

    private createIoTDeviceByDto<T extends IoTDevice>(childIoTDeviceType: {
        new (): T;
    }): T {
        return new childIoTDeviceType();
    }

    private async mapIoTDeviceDtoToIoTDevice<T extends IoTDevice>(
        createIoTDeviceDto: CreateIoTDeviceDto,
        iotDevice: T
    ): Promise<T> {
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

        if (createIoTDeviceDto.comment != null) {
            iotDevice.comment = createIoTDeviceDto.comment;
        } else {
            iotDevice.comment = null;
        }

        if (createIoTDeviceDto.commentOnLocation != null) {
            iotDevice.commentOnLocation = createIoTDeviceDto.commentOnLocation;
        } else {
            iotDevice.commentOnLocation = null;
        }

        return iotDevice;
    }
}
