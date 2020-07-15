import {
    Controller,
    Post,
    Header,
    Body,
    Get,
    Param,
    NotFoundException,
    Put,
    Delete,
    BadRequestException,
    Query,
} from "@nestjs/common";
import {
    ApiTags,
    ApiOperation,
    ApiBadRequestResponse,
    ApiNotFoundResponse,
    ApiProduces,
    ApiResponse,
} from "@nestjs/swagger";
import { IoTDeviceService } from "@services/iot-device.service";
import { CreateIoTDeviceDto } from "@dto/create/create-iot-device.dto";
import { IoTDevice } from "@entities/iot-device.entity";
import { UpdateIoTDeviceDto } from "@dto/update/update-iot-device.dto";
import { DeleteResponseDto } from "@dto/delete/delete-application-response.dto";
import {ListAllIoTDevicesReponseDto} from "@dto/list/list-all-iot-devices-response.dto"
import { ListAllEntities } from "@dto/list/list-all-entities.dto";
import { ListAllDataTargetsDto } from "@dto/list/list-all-data-targets.dto";
@ApiTags("IoT Device")
@Controller("iot-device")
export class IoTDeviceController {
    constructor(private iotDeviceService: IoTDeviceService) {}

    //TODO
    @Get()
    @ApiProduces("application/json")
    @ApiOperation({ summary: "Find all devices (paginated)" })
    @ApiResponse({
        status: 200,
        description: "Success",
        type: ListAllIoTDevicesReponseDto,
    })
    async findAll(
        @Query() query?: ListAllDataTargetsDto
    ): Promise<ListAllIoTDevicesReponseDto> {
        const ioTDevice = this.iotDeviceService.findAndCountWithPagination(
            query
        );
        return ioTDevice;
    }

    @Get(":id")
    @ApiOperation({ summary: "Find one IoT-Device by id" })
    @ApiNotFoundResponse()
    async findOne(@Param("id") id: number): Promise<IoTDevice> {
        try {
            return await this.iotDeviceService.findOne(id);
        } catch (err) {
            throw new NotFoundException(`No element found by id: ${id}`);
        }
    }

    @Post()
    @Header("Cache-Control", "none")
    @ApiOperation({ summary: "Create a new IoTDevice" })
    @ApiBadRequestResponse()
    async create(@Body() createDto: CreateIoTDeviceDto): Promise<IoTDevice> {
        const ioTDevice = this.iotDeviceService.create(createDto);
        return ioTDevice;
    }

    @Put(":id")
    @Header("Cache-Control", "none")
    @ApiOperation({ summary: "Update an existing IoT-Device" })
    @ApiBadRequestResponse()
    async update(
        @Param("id") id: number,
        @Body() updateDto: UpdateIoTDeviceDto
    ): Promise<IoTDevice> {
        const ioTDevice = await this.iotDeviceService.update(id, updateDto);

        return ioTDevice;
    }

    @Delete(":id")
    @ApiOperation({ summary: "Delete an existing IoT-Device" })
    @ApiBadRequestResponse()
    async delete(@Param("id") id: number): Promise<DeleteResponseDto> {
        try {
            const result = await this.iotDeviceService.delete(id);
            return new DeleteResponseDto(result.affected);
        } catch (err) {
            throw new BadRequestException(err);
        }
    }
}
