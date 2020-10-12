import {
    BadRequestException,
    Body,
    Controller,
    Delete,
    Get,
    Header,
    Logger,
    NotFoundException,
    Param,
    ParseIntPipe,
    Post,
    Put,
    Req,
    UseGuards,
} from "@nestjs/common";
import {
    ApiBadRequestResponse,
    ApiBearerAuth,
    ApiForbiddenResponse,
    ApiNotFoundResponse,
    ApiOperation,
    ApiTags,
    ApiUnauthorizedResponse,
} from "@nestjs/swagger";

import { JwtAuthGuard } from "@auth/jwt-auth.guard";
import { Read } from "@auth/roles.decorator";
import { RolesGuard } from "@auth/roles.guard";
import { CreateIoTDeviceDto } from "@dto/create-iot-device.dto";
import { DeleteResponseDto } from "@dto/delete-application-response.dto";
import { AuthenticatedRequest } from "@dto/internal/authenticated-request";
import { LoRaWANDeviceWithChirpstackDataDto } from "@dto/lorawan-device-with-chirpstack-data.dto";
import { UpdateIoTDeviceDto } from "@dto/update-iot-device.dto";
import { IoTDevice } from "@entities/iot-device.entity";
import { ErrorCodes } from "@enum/error-codes.enum";
import {
    checkIfUserHasReadAccessToApplication,
    checkIfUserHasWriteAccessToApplication,
} from "@helpers/security-helper";
import { IoTDeviceService } from "@services/device-management/iot-device.service";
import { SigFoxDeviceWithBackendDataDto } from "@dto/sigfox-device-with-backend-data.dto";
import { CreateIoTDeviceDownlinkDto } from "@dto/create-iot-device-downlink.dto";
import { IoTDeviceDownlinkService } from "@services/device-management/iot-device-downlink.service";

@ApiTags("IoT Device")
@Controller("iot-device")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@Read()
@ApiForbiddenResponse()
@ApiUnauthorizedResponse()
export class IoTDeviceController {
    constructor(
        private iotDeviceService: IoTDeviceService,
        private downlinkService: IoTDeviceDownlinkService
    ) {}

    @Get(":id")
    @ApiOperation({ summary: "Find one IoT-Device by id" })
    @ApiNotFoundResponse()
    async findOne(
        @Req() req: AuthenticatedRequest,
        @Param("id", new ParseIntPipe()) id: number
    ): Promise<
        IoTDevice | LoRaWANDeviceWithChirpstackDataDto | SigFoxDeviceWithBackendDataDto
    > {
        let result = undefined;
        try {
            result = await this.iotDeviceService.findOneWithApplicationAndMetadata(
                id,
                true
            );
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

        const device = this.iotDeviceService.create(createDto);
        return device;
    }

    @Post(":id/downlink")
    @Header("Cache-Control", "none")
    @ApiOperation({ summary: "Schedule downlink for SigFox or LoRaWAN device" })
    @ApiBadRequestResponse()
    async createDownlink(
        @Req() req: AuthenticatedRequest,
        @Param("id", new ParseIntPipe()) id: number,
        @Body() dto: CreateIoTDeviceDownlinkDto
    ): Promise<void> {
        const device = await this.iotDeviceService.findOneWithApplicationAndMetadata(id);
        if (!device) {
            throw new NotFoundException();
        }
        checkIfUserHasWriteAccessToApplication(req, id);

        await this.downlinkService.createDownlink(dto, device);

        return;
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
            id,
            false
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
            id,
            false
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
