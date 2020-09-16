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
    Logger,
    Query,
    UseGuards,
    Req,
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
import { DeleteResponseDto } from "@dto/delete-application-response.dto";
import { ErrorCodes } from "@enum/error-codes.enum";
import { PayloadDecoderService } from "@services/payload-decoder.service";
import { PayloadDecoder } from "@entities/payload-decoder.entity";
import { CreatePayloadDecoderDto } from "@dto/create-payload-decoder.dto";
import { UpdatePayloadDecoderDto } from "@dto/update-payload-decoder.dto";
import { ListAllPayloadDecoderReponseDto } from "@dto/list-all-payload-decoders-response.dto";
import { JwtAuthGuard } from "@auth/jwt-auth.guard";
import { RolesGuard } from "@auth/roles.guard";
import { Read, Write } from "@auth/roles.decorator";
import {
    checkIfUserHasReadAccessToOrganization,
    checkIfUserHasWriteAccessToOrganization,
} from "@helpers/security-helper";
import { AuthenticatedRequest } from "@dto/internal/authenticated-request";
import { ListAllPayloadDecoderDto } from "@dto/list-all-payload-decoder.dto";

@ApiTags("Payload Decoder")
@Controller("payload-decoder")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@Read()
@ApiForbiddenResponse()
@ApiUnauthorizedResponse()
export class PayloadDecoderController {
    constructor(private payloadDecoderService: PayloadDecoderService) {}

    @Get(":id")
    @ApiOperation({ summary: "Find one Payload Decoder by id" })
    @ApiNotFoundResponse()
    async findOne(
        @Req() req: AuthenticatedRequest,
        @Param("id") id: number
    ): Promise<PayloadDecoder> {
        let result = undefined;
        try {
            result = await this.payloadDecoderService.findOne(id);
        } catch (err) {
            Logger.error(
                `Error occured during findOne: '${JSON.stringify(err)}'`
            );
        }

        if (!result) {
            throw new NotFoundException(ErrorCodes.IdDoesNotExists);
        }

        checkIfUserHasReadAccessToOrganization(req, result?.organization?.id);

        return result;
    }

    @Get()
    @ApiOperation({ summary: "Find all Payload Decoders" })
    @ApiNotFoundResponse()
    async findAll(
        @Req() req: AuthenticatedRequest,
        @Query() query?: ListAllPayloadDecoderDto
    ): Promise<ListAllPayloadDecoderReponseDto> {
        if (req.user.permissions.isGlobalAdmin) {
            return await this.payloadDecoderService.findAndCountWithPagination(
                query,
                null
            );
        }

        const allowedOrganizations = req.user.permissions.getAllOrganizationsWithAtLeastRead();
        if (query?.organizationId) {
            checkIfUserHasReadAccessToOrganization(req, query.organizationId);
        }

        const result = await this.payloadDecoderService.findAndCountWithPagination(
            query,
            query.organizationId ? [query.organizationId] : allowedOrganizations
        );
        return result;
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
        checkIfUserHasWriteAccessToOrganization(req, createDto.organizationId);

        // TODO: Valider at funktionen er gyldig
        const payloadDecoder = await this.payloadDecoderService.create(
            createDto
        );
        return payloadDecoder;
    }

    @Put(":id")
    @Write()
    @Header("Cache-Control", "none")
    @ApiOperation({ summary: "Update an existing Payload Decoder" })
    @ApiBadRequestResponse()
    async update(
        @Req() req: AuthenticatedRequest,
        @Param("id") id: number,
        @Body() updateDto: UpdatePayloadDecoderDto
    ): Promise<PayloadDecoder> {
        checkIfUserHasWriteAccessToOrganization(req, updateDto.organizationId);
        const oldDecoder = await this.payloadDecoderService.findOne(id);
        if (oldDecoder?.organization?.id) {
            checkIfUserHasWriteAccessToOrganization(
                req,
                oldDecoder.organization.id
            );
        }
        // TODO: Valider at funktionen er gyldig
        const payloadDecoder = await this.payloadDecoderService.update(
            id,
            updateDto
        );

        return payloadDecoder;
    }

    @Delete(":id")
    @Write()
    @ApiOperation({ summary: "Delete an existing Payload Decoder" })
    @ApiNotFoundResponse()
    async delete(
        @Req() req: AuthenticatedRequest,
        @Param("id") id: number
    ): Promise<DeleteResponseDto> {
        try {
            const oldDecoder = await this.payloadDecoderService.findOne(id);
            if (oldDecoder?.organization?.id) {
                checkIfUserHasWriteAccessToOrganization(
                    req,
                    oldDecoder.organization.id
                );
            }

            const result = await this.payloadDecoderService.delete(id);
            if (result.affected == 0) {
                throw new NotFoundException(ErrorCodes.IdDoesNotExists);
            }

            return new DeleteResponseDto(result.affected);
        } catch (err) {
            throw new NotFoundException(err);
        }
    }
}
