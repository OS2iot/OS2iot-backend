import {
    Body,
    Controller,
    Get,
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
    ApiBearerAuth,
    ApiForbiddenResponse,
    ApiOperation,
    ApiProduces,
    ApiTags,
} from "@nestjs/swagger";

import { JwtAuthGuard } from "@auth/jwt-auth.guard";
import { Read, Write } from "@auth/roles.decorator";
import { RolesGuard } from "@auth/roles.guard";
import { AuthenticatedRequest } from "@dto/internal/authenticated-request";
import { CreateSigFoxGroupRequestDto } from "@dto/sigfox/internal/create-sigfox-group-request.dto";
import { ListAllSigFoxGroupReponseDto } from "@dto/sigfox/internal/list-all-sigfox-groups-response.dto";
import { SigFoxGetAllRequestDto } from "@dto/sigfox/internal/sigfox-get-all-request.dto";
import { UpdateSigFoxGroupRequestDto } from "@dto/sigfox/internal/update-sigfox-group-request.dto";
import { SigFoxGroup } from "@entities/sigfox-group.entity";
import {
    checkIfUserHasReadAccessToOrganization,
    checkIfUserHasWriteAccessToOrganization,
} from "@helpers/security-helper";
import { SigFoxGroupService } from "@services/sigfox/sigfox-group.service";

@ApiTags("SigFox")
@Controller("sigfox-group")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@Read()
@ApiForbiddenResponse()
export class SigfoxGroupController {
    constructor(private service: SigFoxGroupService) {}

    @Get()
    @ApiProduces("application/json")
    @ApiOperation({ summary: "List all SigFox Groups" })
    @Read()
    async getAll(
        @Req() req: AuthenticatedRequest,
        @Query() query: SigFoxGetAllRequestDto
    ): Promise<ListAllSigFoxGroupReponseDto> {
        checkIfUserHasReadAccessToOrganization(req, query.organizationId);
        return await this.service.findAll(query.organizationId);
    }

    @Get(":id")
    @ApiProduces("application/json")
    @ApiOperation({ summary: "List a SigFox Groups" })
    @Read()
    async getOne(
        @Req() req: AuthenticatedRequest,
        @Param("id", new ParseIntPipe()) id: number
    ): Promise<SigFoxGroup> {
        let group: SigFoxGroup;
        try {
            group = await this.service.findOne(id);
        } catch (err) {
            throw new NotFoundException();
        }
        checkIfUserHasReadAccessToOrganization(req, group.belongsTo.id);
        return group;
    }

    @Post()
    @ApiProduces("application/json")
    @ApiOperation({ summary: "List all SigFox Groups" })
    @Write()
    async create(
        @Req() req: AuthenticatedRequest,
        @Body() query: CreateSigFoxGroupRequestDto
    ): Promise<SigFoxGroup> {
        checkIfUserHasWriteAccessToOrganization(req, query.organizationId);

        return await this.service.create(query);
    }

    @Put(":id")
    @ApiProduces("application/json")
    @ApiOperation({ summary: "Update a SigFox Groups" })
    @Write()
    async update(
        @Req() req: AuthenticatedRequest,
        @Param("id", new ParseIntPipe()) id: number,
        @Body() dto: UpdateSigFoxGroupRequestDto
    ): Promise<SigFoxGroup> {
        let group: SigFoxGroup;
        try {
            group = await this.service.findOne(id);
        } catch (err) {
            throw new NotFoundException();
        }
        checkIfUserHasWriteAccessToOrganization(req, group.belongsTo.id);
        const updatedSigfoxGroup = await this.service.update(group, dto)

        return updatedSigfoxGroup
    }
}
