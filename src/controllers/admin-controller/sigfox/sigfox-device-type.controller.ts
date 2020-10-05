import { JwtAuthGuard } from "@auth/jwt-auth.guard";
import { Read, Write } from "@auth/roles.decorator";
import { RolesGuard } from "@auth/roles.guard";
import { AuthenticatedRequest } from "@dto/internal/authenticated-request";
import { CreateSigFoxApiDeviceTypeRequestDto } from "@dto/sigfox/external/create-sigfox-api-device-type-request.dto";
import {
    SigFoxApiDeviceTypeContent,
    SigFoxApiDeviceTypeResponse,
} from "@dto/sigfox/external/sigfox-api-device-type-response.dto";
import { SigFoxApiIdReferenceDto } from "@dto/sigfox/external/sigfox-api-id-reference.dto";
import { UpdateSigFoxApiDeviceTypeRequestDto } from "@dto/sigfox/external/update-sigfox-api-device-type-request.dto";
import { SigFoxGroup } from "@entities/sigfox-group.entity";
import { ErrorCodes } from "@enum/error-codes.enum";
import {
    checkIfUserHasReadAccessToOrganization,
    checkIfUserHasWriteAccessToOrganization,
} from "@helpers/security-helper";
import {
    BadRequestException,
    Body,
    Controller,
    Get,
    HttpCode,
    Logger,
    Param,
    ParseIntPipe,
    Post,
    Put,
    Query,
    Req,
    UnauthorizedException,
    UseGuards,
} from "@nestjs/common";
import {
    ApiBadRequestResponse,
    ApiBearerAuth,
    ApiCreatedResponse,
    ApiForbiddenResponse,
    ApiNoContentResponse,
    ApiOkResponse,
    ApiOperation,
    ApiProduces,
    ApiTags,
} from "@nestjs/swagger";
import { SigFoxApiDeviceTypeService } from "@services/sigfox/sigfox-api-device-type.service";
import { SigfoxApiUsersService } from "@services/sigfox/sigfox-api-users.service";
import { SigFoxGroupService } from "@services/sigfox/sigfox-group.service";

@ApiTags("SigFox")
@Controller("sigfox-device-type")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@Read()
@ApiForbiddenResponse()
export class SigfoxDeviceTypeController {
    constructor(
        private service: SigFoxApiDeviceTypeService,
        private usersService: SigfoxApiUsersService,
        private sigfoxGroupService: SigFoxGroupService
    ) {}

    private readonly logger = new Logger(SigfoxDeviceTypeController.name);

    @Get()
    @ApiProduces("application/json")
    @ApiOperation({ summary: "List all SigFox Device Types for a SigFox Group" })
    async getAll(
        @Req() req: AuthenticatedRequest,
        @Query("groupId", new ParseIntPipe()) groupId: number
    ): Promise<SigFoxApiDeviceTypeResponse> {
        const group: SigFoxGroup = await this.sigfoxGroupService.findOneWithPassword(
            groupId
        );
        checkIfUserHasReadAccessToOrganization(req, group.belongsTo.id);
        const sigFoxApiGroup = await this.usersService.getByUserId(group.username, group);

        return await this.service.getAllByGroupIds(group, [sigFoxApiGroup.group.id]);
    }

    @Get(":id")
    @ApiProduces("application/json")
    @ApiOperation({ summary: "List one SigFox Device Type" })
    async getOne(
        @Req() req: AuthenticatedRequest,
        @Param("id") id: string,
        @Query("groupId", new ParseIntPipe()) groupId: number
    ): Promise<SigFoxApiDeviceTypeContent> {
        const group: SigFoxGroup = await this.sigfoxGroupService.findOneWithPassword(
            groupId
        );
        checkIfUserHasReadAccessToOrganization(req, group.belongsTo.id);

        return await this.service.getById(group, id);
    }

    @Post()
    @Write()
    @ApiCreatedResponse()
    @ApiBadRequestResponse()
    async create(
        @Req() req: AuthenticatedRequest,
        @Body() dto: CreateSigFoxApiDeviceTypeRequestDto,
        @Query("groupId", new ParseIntPipe()) groupId: number
    ): Promise<SigFoxApiIdReferenceDto> {
        const group: SigFoxGroup = await this.sigfoxGroupService.findOneWithPassword(
            groupId
        );
        checkIfUserHasWriteAccessToOrganization(req, group.belongsTo.id);
        return await this.service.create(group, dto);
    }

    @Put(":id")
    @Write()
    @ApiNoContentResponse()
    @ApiBadRequestResponse()
    @HttpCode(204)
    async update(
        @Req() req: AuthenticatedRequest,
        @Param("id") id: string,
        @Body() dto: UpdateSigFoxApiDeviceTypeRequestDto,
        @Query("groupId", new ParseIntPipe()) groupId: number
    ): Promise<void> {
        const group: SigFoxGroup = await this.sigfoxGroupService.findOneWithPassword(
            groupId
        );
        checkIfUserHasWriteAccessToOrganization(req, group.belongsTo.id);
        await this.service.update(group, id, dto);
    }
}
