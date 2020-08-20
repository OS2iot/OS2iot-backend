import {
    Controller,
    Get,
    Query,
    Post,
    Body,
    Param,
    Put,
    Delete,
    NotFoundException,
} from "@nestjs/common";
import { IoTDevicePayloadDecoderDataTargetConnectionService } from "@services/iot-device-payload-decoder-data-target-connection.service";
import { ListAllConnectionsReponseDto } from "@dto/list-all-connections-response.dto";
import { ListAllEntitiesDto } from "@dto/list-all-entities.dto";
import {
    ApiProduces,
    ApiOperation,
    ApiResponse,
    ApiTags,
    ApiBadRequestResponse,
    ApiNotFoundResponse,
} from "@nestjs/swagger";
import { ListAllApplicationsReponseDto } from "@dto/list-all-applications-response.dto";
import { CreateIoTDevicePayloadDecoderDataTargetConnectionDto } from "../entities/dto/create-iot-device-payload-decoder-data-target-connection.dto";
import { IoTDevicePayloadDecoderDataTargetConnection } from "@entities/iot-device-payload-decoder-data-target-connection.entity";
import { UpdateIoTDevicePayloadDecoderDataTargetConnectionDto } from "@dto/update-iot-device-payload-decoder-data-target-connection.dto";
import { DeleteResponseDto } from "@dto/delete-application-response.dto";
import { ErrorCodes } from "@enum/error-codes.enum";

@ApiTags("IoT-Device, PayloadDecoder and DataTarget Connection")
@Controller("iot-device-payload-decoder-data-target-connection")
export class IoTDevicePayloadDecoderDataTargetConnectionController {
    constructor(
        public service: IoTDevicePayloadDecoderDataTargetConnectionService
    ) {}

    @Get()
    @ApiProduces("application/json")
    @ApiOperation({
        summary:
            "Find all connections between IoT-Devices, PayloadDecoders and DataTargets (paginated)",
    })
    @ApiResponse({
        status: 200,
        description: "Success",
        type: ListAllApplicationsReponseDto,
    })
    async findAll(
        @Query() query?: ListAllEntitiesDto
    ): Promise<ListAllConnectionsReponseDto> {
        return await this.service.findAndCountWithPagination(query);
    }

    @Get(":id")
    @ApiNotFoundResponse({
        description: "If the id of the entity doesn't exist",
    })
    async findOne(
        @Param("id") id: number
    ): Promise<IoTDevicePayloadDecoderDataTargetConnection> {
        return await this.service.findOne(id);
    }

    @Get("byIoTDevice/:id")
    @ApiOperation({
        summary: "Find all connections by IoT-Device id",
    })
    async findByIoTDeviceId(
        @Param("id") id: number
    ): Promise<ListAllConnectionsReponseDto> {
        return await this.service.findAllByIoTDeviceId(id);
    }

    @Get("byPayloadDecoder/:id")
    @ApiOperation({
        summary: "Find all connections by PayloadDecoder id",
    })
    async findByPayloadDecoderId(
        @Param("id") id: number
    ): Promise<ListAllConnectionsReponseDto> {
        return await this.service.findAllByPayloadDecoderId(id);
    }

    @Get("byDataTarget/:id")
    @ApiOperation({
        summary: "Find all connections by DataTarget id",
    })
    async findByDataTargetId(
        @Param("id") id: number
    ): Promise<ListAllConnectionsReponseDto> {
        return await this.service.findAllByDataTargetId(id);
    }

    @Post()
    @ApiBadRequestResponse({
        description: "If one or more of the id's are invalid references.",
    })
    async create(
        @Body()
        createDto: CreateIoTDevicePayloadDecoderDataTargetConnectionDto
    ): Promise<IoTDevicePayloadDecoderDataTargetConnection> {
        return await this.service.create(createDto);
    }

    @Put(":id")
    @ApiNotFoundResponse({
        description: "If the id of the entity doesn't exist",
    })
    @ApiBadRequestResponse({
        description: "If one or more of the id's are invalid references.",
    })
    async update(
        @Param("id") id: number,
        @Body()
        updateDto: UpdateIoTDevicePayloadDecoderDataTargetConnectionDto
    ): Promise<IoTDevicePayloadDecoderDataTargetConnection> {
        return await this.service.update(id, updateDto);
    }

    @Delete(":id")
    @ApiNotFoundResponse({
        description: "If the id of the entity doesn't exist",
    })
    async delete(@Param("id") id: number): Promise<DeleteResponseDto> {
        try {
            const result = await this.service.delete(id);

            if (result.affected === 0) {
                throw new NotFoundException(ErrorCodes.IdDoesNotExists);
            }
            return new DeleteResponseDto(result.affected);
        } catch (err) {
            throw new NotFoundException(err);
        }
    }
}
