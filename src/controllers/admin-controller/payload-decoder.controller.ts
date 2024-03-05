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
    Query,
    Req,
    UseGuards,
} from "@nestjs/common";
import {
    ApiBadRequestResponse,
    ApiForbiddenResponse,
    ApiNotFoundResponse,
    ApiOperation,
    ApiTags,
    ApiUnauthorizedResponse,
} from "@nestjs/swagger";

import { ComposeAuthGuard } from "@auth/compose-auth.guard";
import { ApplicationAdmin, Read } from "@auth/roles.decorator";
import { RolesGuard } from "@auth/roles.guard";
import { CreatePayloadDecoderDto } from "@dto/create-payload-decoder.dto";
import { DeleteResponseDto } from "@dto/delete-application-response.dto";
import { AuthenticatedRequest } from "@dto/internal/authenticated-request";
import { ListAllPayloadDecoderDto } from "@dto/list-all-payload-decoder.dto";
import { ListAllPayloadDecoderResponseDto } from "@dto/list-all-payload-decoders-response.dto";
import { UpdatePayloadDecoderDto } from "@dto/update-payload-decoder.dto";
import { PayloadDecoder } from "@entities/payload-decoder.entity";
import { ErrorCodes } from "@enum/error-codes.enum";
import { checkIfUserHasAccessToOrganization, OrganizationAccessScope } from "@helpers/security-helper";
import { PayloadDecoderService } from "@services/data-management/payload-decoder.service";
import { AuditLog } from "@services/audit-log.service";
import { ActionType } from "@entities/audit-log-entry";
import { ApiAuth } from "@auth/swagger-auth-decorator";

@ApiTags("Payload Decoder")
@Controller("payload-decoder")
@UseGuards(ComposeAuthGuard, RolesGuard)
@ApiAuth()
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
        return await this.payloadDecoderService.findAndCountWithPagination(query, query.organizationId);
    }

    @Post()
    @ApplicationAdmin()
    @Header("Cache-Control", "none")
    @ApiOperation({ summary: "Create a new Payload Decoder" })
    @ApiBadRequestResponse()
    async create(
        @Req() req: AuthenticatedRequest,
        @Body() createDto: CreatePayloadDecoderDto
    ): Promise<PayloadDecoder> {
        try {
            checkIfUserHasAccessToOrganization(req, createDto.organizationId, OrganizationAccessScope.ApplicationWrite);

            // TODO: Valider at funktionen er gyldig
            const payloadDecoder = await this.payloadDecoderService.create(createDto, req.user.userId);
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
    @ApplicationAdmin()
    @Header("Cache-Control", "none")
    @ApiOperation({ summary: "Update an existing Payload Decoder" })
    @ApiBadRequestResponse()
    async update(
        @Req() req: AuthenticatedRequest,
        @Param("id", new ParseIntPipe()) id: number,
        @Body() updateDto: UpdatePayloadDecoderDto
    ): Promise<PayloadDecoder> {
        try {
            checkIfUserHasAccessToOrganization(req, updateDto.organizationId, OrganizationAccessScope.ApplicationWrite);
            const oldDecoder = await this.payloadDecoderService.findOne(id);
            if (oldDecoder?.organization?.id) {
                checkIfUserHasAccessToOrganization(
                    req,
                    oldDecoder.organization.id,
                    OrganizationAccessScope.ApplicationWrite
                );
            }
            // TODO: Valider at funktionen er gyldig
            const payloadDecoder = await this.payloadDecoderService.update(id, updateDto, req.user.userId);
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
    @ApplicationAdmin()
    @ApiOperation({ summary: "Delete an existing Payload Decoder" })
    @ApiNotFoundResponse()
    async delete(
        @Req() req: AuthenticatedRequest,
        @Param("id", new ParseIntPipe()) id: number
    ): Promise<DeleteResponseDto> {
        try {
            const oldDecoder = await this.payloadDecoderService.findOne(id);
            if (oldDecoder?.organization?.id) {
                checkIfUserHasAccessToOrganization(
                    req,
                    oldDecoder.organization.id,
                    OrganizationAccessScope.ApplicationWrite
                );
            }

            const result = await this.payloadDecoderService.delete(id);
            if (result.affected == 0) {
                throw new NotFoundException(ErrorCodes.IdDoesNotExists);
            }
            AuditLog.success(ActionType.DELETE, PayloadDecoder.name, req.user.userId, id);
            return new DeleteResponseDto(result.affected);
        } catch (err) {
            AuditLog.fail(ActionType.DELETE, PayloadDecoder.name, req.user.userId);
            if (err?.name == "QueryFailedError") {
                throw new BadRequestException(ErrorCodes.DeleteNotAllowedItemIsInUse);
            }
            throw new NotFoundException(err);
        }
    }
}
