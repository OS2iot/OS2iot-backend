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
} from "@nestjs/common";
import {
    ApiTags,
    ApiOperation,
    ApiBadRequestResponse,
    ApiNotFoundResponse,
} from "@nestjs/swagger";
import { IoTDeviceService } from "@services/iot-device.service";
import { CreateIoTDeviceDto } from "@dto/create-iot-device.dto";
import { IoTDevice } from "@entities/iot-device.entity";
import { UpdateIoTDeviceDto } from "@dto/update-iot-device.dto";
import { DeleteResponseDto } from "@dto/delete-application-response.dto";

@ApiTags("IoT Device")
@Controller("iot-device")
export class IoTDeviceController {
    constructor(private iotDeviceService: IoTDeviceService) {}

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
        const application = this.iotDeviceService.create(createDto);
        return application;
    }

    @Put(":id")
    @Header("Cache-Control", "none")
    @ApiOperation({ summary: "Update an existing IoT-Device" })
    @ApiBadRequestResponse()
    async update(
        @Param("id") id: number,
        @Body() updateDto: UpdateIoTDeviceDto
    ): Promise<IoTDevice> {
        const application = await this.iotDeviceService.update(id, updateDto);

        return application;
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
