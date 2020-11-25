import {
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
    Query,
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
import { Read, Write } from "@auth/roles.decorator";
import { RolesGuard } from "@auth/roles.guard";
import { CreatePayloadDecoderDto } from "@dto/create-payload-decoder.dto";
import { DeleteResponseDto } from "@dto/delete-application-response.dto";
import { AuthenticatedRequest } from "@dto/internal/authenticated-request";
import { ListAllPayloadDecoderDto } from "@dto/list-all-payload-decoder.dto";
import { ListAllPayloadDecoderResponseDto } from "@dto/list-all-payload-decoders-response.dto";
import { UpdatePayloadDecoderDto } from "@dto/update-payload-decoder.dto";
import { PayloadDecoder } from "@entities/payload-decoder.entity";
import { ErrorCodes } from "@enum/error-codes.enum";
import {
    checkIfUserHasReadAccessToOrganization,
    checkIfUserHasWriteAccessToOrganization,
} from "@helpers/security-helper";
import { PayloadDecoderService } from "@services/data-management/payload-decoder.service";
import { AuditLog } from "@services/audit-log.service";
import { ActionType } from "@entities/audit-log-entry";

@ApiTags("Payload Decoder")
@Controller("payload-decoder")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@Read()
@ApiForbiddenResponse()
@ApiUnauthorizedResponse()
export class PayloadDecoderController {
    constructor(private payloadDecoderService: PayloadDecoderService) {}

    private readonly logger = new Logger(PayloadDecoderController.name);

    @Get(":id")
    @ApiOperation({ summary: "Find one Payload Decoder by id" })
    @ApiNotFoundResponse()
    async findOne(
        @Req() req: AuthenticatedRequest,
        @Param("id", new ParseIntPipe()) id: number
    ): Promise<PayloadDecoder> {
        let result = undefined;
        try {
            result = await this.payloadDecoderService.findOne(id);
        } catch (err) {
            this.logger.error(`Error occured during findOne: '${JSON.stringify(err)}'`);
        }

        if (!result) {
            throw new NotFoundException(ErrorCodes.IdDoesNotExists);
        }
        return result;
    }

    @Get()
    @ApiOperation({ summary: "Find all Payload Decoders" })
    @ApiNotFoundResponse()
    async findAll(
        @Req() req: AuthenticatedRequest,
        @Query() query?: ListAllPayloadDecoderDto
    ): Promise<ListAllPayloadDecoderResponseDto> {
        return await this.payloadDecoderService.findAndCountWithPagination(
            query,
            query.organizationId
        );
    }

    @Post()
    @Write()
    @Header("Cache-Control", "none")
    @ApiOperation({ summary: "Create a new Payload Decoder" })
    @ApiBadRequestResponse()
    async create(
        @Req() req: AuthenticatedRequest,
        @Body() createDto: CreatePayloadDecoderDto
    ): Promise<PayloadDecoder> {
        try {
            checkIfUserHasWriteAccessToOrganization(req, createDto.organizationId);

            // TODO: Valider at funktionen er gyldig
            const payloadDecoder = await this.payloadDecoderService.create(
                createDto,
                req.user.userId
            );
            AuditLog.success(
                ActionType.CREATE,
                PayloadDecoder.name,
                req.user.userId,
                payloadDecoder.id,
                payloadDecoder.name
            );
            return payloadDecoder;
        } catch (err) {
            AuditLog.fail(ActionType.CREATE, PayloadDecoder.name, req.user.userId);
            throw err;
        }
    }

    @Put(":id")
    @Write()
    @Header("Cache-Control", "none")
    @ApiOperation({ summary: "Update an existing Payload Decoder" })
    @ApiBadRequestResponse()
    async update(
        @Req() req: AuthenticatedRequest,
        @Param("id", new ParseIntPipe()) id: number,
        @Body() updateDto: UpdatePayloadDecoderDto
    ): Promise<PayloadDecoder> {
        try {
            checkIfUserHasWriteAccessToOrganization(req, updateDto.organizationId);
            const oldDecoder = await this.payloadDecoderService.findOne(id);
            if (oldDecoder?.organization?.id) {
                checkIfUserHasWriteAccessToOrganization(req, oldDecoder.organization.id);
            }
            // TODO: Valider at funktionen er gyldig
            const payloadDecoder = await this.payloadDecoderService.update(
                id,
                updateDto,
                req.user.userId
            );
            AuditLog.success(
                ActionType.UPDATE,
                PayloadDecoder.name,
                req.user.userId,
                payloadDecoder.id,
                payloadDecoder.name
            );

            return payloadDecoder;
        } catch (err) {
            AuditLog.fail(ActionType.UPDATE, PayloadDecoder.name, req.user.userId);
            throw err;
        }
    }

    @Delete(":id")
    @Write()
    @ApiOperation({ summary: "Delete an existing Payload Decoder" })
    @ApiNotFoundResponse()
    async delete(
        @Req() req: AuthenticatedRequest,
        @Param("id", new ParseIntPipe()) id: number
    ): Promise<DeleteResponseDto> {
        try {
            const oldDecoder = await this.payloadDecoderService.findOne(id);
            if (oldDecoder?.organization?.id) {
                checkIfUserHasWriteAccessToOrganization(req, oldDecoder.organization.id);
            }

            const result = await this.payloadDecoderService.delete(id);
            if (result.affected == 0) {
                throw new NotFoundException(ErrorCodes.IdDoesNotExists);
            }
            AuditLog.success(ActionType.DELETE, PayloadDecoder.name, req.user.userId, id);
            return new DeleteResponseDto(result.affected);
        } catch (err) {
            AuditLog.fail(ActionType.DELETE, PayloadDecoder.name, req.user.userId);
            throw new NotFoundException(err);
        }
    }
}
