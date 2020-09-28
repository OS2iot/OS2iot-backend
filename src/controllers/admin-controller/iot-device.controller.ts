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
    Logger,
    UseGuards,
    Req,
    ParseIntPipe,
} from "@nestjs/common";
import {
    ApiTags,
    ApiOperation,
    ApiBadRequestResponse,
    ApiNotFoundResponse,
    ApiBearerAuth,
    ApiForbiddenResponse,
    ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { IoTDeviceService } from "@services/device-management/iot-device.service";
import { CreateIoTDeviceDto } from "@dto/create-iot-device.dto";
import { IoTDevice } from "@entities/iot-device.entity";
import { UpdateIoTDeviceDto } from "@dto/update-iot-device.dto";
import { DeleteResponseDto } from "@dto/delete-application-response.dto";
import { ErrorCodes } from "@enum/error-codes.enum";
import {
    checkIfUserHasReadAccessToApplication,
    checkIfUserHasWriteAccessToApplication,
} from "@helpers/security-helper";
import { AuthenticatedRequest } from "@dto/internal/authenticated-request";
import { JwtAuthGuard } from "@auth/jwt-auth.guard";
import { RolesGuard } from "@auth/roles.guard";
import { Read } from "@auth/roles.decorator";
import { LoRaWANDeviceWithChirpstackDataDto } from "@dto/lorawan-device-with-chirpstack-data.dto";

@ApiTags("IoT Device")
@Controller("iot-device")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@Read()
@ApiForbiddenResponse()
@ApiUnauthorizedResponse()
export class IoTDeviceController {
    constructor(private iotDeviceService: IoTDeviceService) {}

    @Get(":id")
    @ApiOperation({ summary: "Find one IoT-Device by id" })
    @ApiNotFoundResponse()
    async findOne(
        @Req() req: AuthenticatedRequest,
        @Param("id", new ParseIntPipe()) id: number
    ): Promise<IoTDevice | LoRaWANDeviceWithChirpstackDataDto> {
        let result = undefined;
        try {
            result = await this.iotDeviceService.findOneWithApplicationAndMetadata(id);
        } catch (err) {
            Logger.error(`Error occured during findOne: '${JSON.stringify(err)}'`);
        }

        if (!result) {
            throw new NotFoundException(ErrorCodes.IdDoesNotExists);
        }

        checkIfUserHasReadAccessToApplication(req, result.application.id);

        return result;
    }

    @Post()
    @Header("Cache-Control", "none")
    @ApiOperation({ summary: "Create a new IoTDevice" })
    @ApiBadRequestResponse()
    async create(
        @Req() req: AuthenticatedRequest,
        @Body() createDto: CreateIoTDeviceDto
    ): Promise<IoTDevice> {
        checkIfUserHasWriteAccessToApplication(req, createDto.applicationId);

        const application = this.iotDeviceService.create(createDto);
        return application;
    }

    @Put(":id")
    @Header("Cache-Control", "none")
    @ApiOperation({ summary: "Update an existing IoT-Device" })
    @ApiBadRequestResponse()
    async update(
        @Req() req: AuthenticatedRequest,
        @Param("id", new ParseIntPipe()) id: number,
        @Body() updateDto: UpdateIoTDeviceDto
    ): Promise<IoTDevice> {
        // Old application
        const oldIotDevice = await this.iotDeviceService.findOneWithApplicationAndMetadata(
            id
        );
        checkIfUserHasWriteAccessToApplication(req, oldIotDevice.application.id);
        if (updateDto.applicationId !== oldIotDevice.application.id) {
            // New application
            checkIfUserHasWriteAccessToApplication(req, updateDto.applicationId);
        }

        const application = await this.iotDeviceService.update(id, updateDto);

        return application;
    }

    @Delete(":id")
    @ApiOperation({ summary: "Delete an existing IoT-Device" })
    @ApiBadRequestResponse()
    async delete(
        @Req() req: AuthenticatedRequest,
        @Param("id", new ParseIntPipe()) id: number
    ): Promise<DeleteResponseDto> {
        const oldIotDevice = await this.iotDeviceService.findOneWithApplicationAndMetadata(
            id
        );
        checkIfUserHasWriteAccessToApplication(req, oldIotDevice?.application?.id);

        try {
            const result = await this.iotDeviceService.delete(id);
            return new DeleteResponseDto(result.affected);
        } catch (err) {
            throw new BadRequestException(err);
        }
    }
}
