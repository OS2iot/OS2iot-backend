import {
    Injectable,
    NotFoundException,
    BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { IoTDevicePayloadDecoderDataTargetConnection } from "@entities/iot-device-payload-decoder-data-target-connection.entity";
import { Repository, FindConditions, DeleteResult } from "typeorm";
import { ListAllEntitiesDto } from "@dto/list-all-entities.dto";
import { ListAllConnectionsReponseDto } from "@dto/list-all-connections-response.dto";
import { CreateIoTDevicePayloadDecoderDataTargetConnectionDto } from "@dto/create-iot-device-payload-decoder-data-target-connection.dto";
import { IoTDeviceService } from "./iot-device.service";
import { DataTargetService } from "./data-target.service";
import { PayloadDecoderService } from "./payload-decoder.service";
import { UpdateIoTDevicePayloadDecoderDataTargetConnectionDto } from "@dto/update-iot-device-payload-decoder-data-target-connection.dto";

@Injectable()
export class IoTDevicePayloadDecoderDataTargetConnectionService {
    constructor(
        @InjectRepository(IoTDevicePayloadDecoderDataTargetConnection)
        private repository: Repository<
            IoTDevicePayloadDecoderDataTargetConnection
        >,
        private ioTDeviceService: IoTDeviceService,
        private dataTargetService: DataTargetService,
        private payloadDecoderService: PayloadDecoderService
    ) {}

    async findAndCountWithPagination(
        query?: ListAllEntitiesDto
    ): Promise<ListAllConnectionsReponseDto> {
        return await this.findAllWithWhere(
            {},
            query.limit,
            query.offset,
            query.sort
        );
    }

    private async findAllWithWhere(
        where?: FindConditions<IoTDevicePayloadDecoderDataTargetConnection>,
        limit?: number,
        offset?: number,
        sort?: "ASC" | "DESC" | 1 | -1
    ): Promise<ListAllConnectionsReponseDto> {
        const [result, total] = await this.repository.findAndCount({
            where: where || {},
            take: limit || 1000,
            skip: offset || 0,
            relations: ["iotDevice", "payloadDecoder", "dataTarget"],
            order: { id: sort },
        });

        return {
            data: result,
            count: total,
        };
    }

    async findAllByIoTDeviceId(
        id: number
    ): Promise<ListAllConnectionsReponseDto> {
        return await this.findAllWithWhere({ iotDevice: { id: id } });
    }

    async findAllByPayloadDecoderId(
        id: number
    ): Promise<ListAllConnectionsReponseDto> {
        return await this.findAllWithWhere({ payloadDecoder: { id: id } });
    }

    async findAllByDataTargetId(
        id: number
    ): Promise<ListAllConnectionsReponseDto> {
        return await this.findAllWithWhere({ dataTarget: { id: id } });
    }

    async findAllByIoTDeviceAndPayloadDecoderId(
        iotDeviceId: number,
        payloadDecoderId: number
    ): Promise<IoTDevicePayloadDecoderDataTargetConnection[]> {
        const res = await this.findAllWithWhere({
            iotDevice: { id: iotDeviceId },
            payloadDecoder: { id: payloadDecoderId },
        });
        return res.data;
    }

    async findOne(
        id: number
    ): Promise<IoTDevicePayloadDecoderDataTargetConnection> {
        try {
            return await this.repository.findOne(id, {
                relations: ["iotDevice", "payloadDecoder", "dataTarget"],
            });
        } catch (err) {
            throw new NotFoundException(
                `Could not find IoTDevicePayloadDecoderDataTargetConnection by id: ${id}`
            );
        }
    }

    async create(
        createConnectionDto: CreateIoTDevicePayloadDecoderDataTargetConnectionDto
    ): Promise<IoTDevicePayloadDecoderDataTargetConnection> {
        const connection = new IoTDevicePayloadDecoderDataTargetConnection();

        const mapped = await this.mapDtoToConnection(
            connection,
            createConnectionDto
        );

        return await this.repository.save(mapped);
    }

    async update(
        id: number,
        updateConnectionDto: UpdateIoTDevicePayloadDecoderDataTargetConnectionDto
    ): Promise<IoTDevicePayloadDecoderDataTargetConnection> {
        let connection;
        try {
            connection = await this.repository.findOneOrFail(id);
        } catch (err) {
            throw new NotFoundException(
                `Could not find IoTDevicePayloadDecoderDataTargetConnection by id: ${id}`
            );
        }

        const mapped = await this.mapDtoToConnection(
            connection,
            updateConnectionDto
        );

        return await this.repository.save(mapped);
    }

    async delete(id: number): Promise<DeleteResult> {
        return await this.repository.delete(id);
    }

    private async mapDtoToConnection(
        connection: IoTDevicePayloadDecoderDataTargetConnection,
        createConnectionDto: CreateIoTDevicePayloadDecoderDataTargetConnectionDto
    ): Promise<IoTDevicePayloadDecoderDataTargetConnection> {
        try {
            connection.iotDevice = await this.ioTDeviceService.findOne(
                createConnectionDto.iotDeviceId
            );
        } catch (err) {
            throw new BadRequestException(
                `Could not find IoT-Device by id: '${createConnectionDto.iotDeviceId}'`
            );
        }
        try {
            connection.dataTarget = await this.dataTargetService.findOne(
                createConnectionDto.dataTargetId
            );
        } catch (err) {
            throw new BadRequestException(
                `Could not find DataTarget by id: '${createConnectionDto.dataTargetId}'`
            );
        }

        if (createConnectionDto.payloadDecoderId != undefined) {
            try {
                connection.payloadDecoder = await this.payloadDecoderService.findOne(
                    createConnectionDto.payloadDecoderId
                );
            } catch (err) {
                throw new BadRequestException(
                    `Could not find PayloadDecoder by id: '${createConnectionDto.payloadDecoderId}'`
                );
            }
        }

        return connection;
    }
}
