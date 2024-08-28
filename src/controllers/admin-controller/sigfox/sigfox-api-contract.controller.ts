import { ComposeAuthGuard } from "@auth/compose-auth.guard";
import { Read } from "@auth/roles.decorator";
import { RolesGuard } from "@auth/roles.guard";
import { AuthenticatedRequest } from "@dto/internal/authenticated-request";
import { SigFoxApiContractInfosContent } from "@dto/sigfox/external/sigfox-api-contract-infos-response.dto";
import { SigFoxGroup } from "@entities/sigfox-group.entity";
import { checkIfUserHasAccessToOrganization, OrganizationAccessScope } from "@helpers/security-helper";
import { Controller, Get, ParseIntPipe, Query, Req, UseGuards } from "@nestjs/common";
import { ApiForbiddenResponse, ApiOperation, ApiProduces, ApiTags } from "@nestjs/swagger";
import { SigFoxApiContractService } from "@services/sigfox/sigfox-api-contract.service";
import { SigFoxGroupService } from "@services/sigfox/sigfox-group.service";
import { ApiAuth } from "@auth/swagger-auth-decorator";

@ApiTags("SigFox")
@Controller("sigfox-contract")
@UseGuards(ComposeAuthGuard, RolesGuard)
@ApiAuth()
@Read()
@ApiForbiddenResponse()
export class SigFoxApiContractController {
  constructor(private service: SigFoxApiContractService, private sigfoxGroupService: SigFoxGroupService) {}

  @Get()
  @ApiProduces("application/json")
  @ApiOperation({ summary: "List all SigFox Contracts for a SigFox Group" })
  async getAll(
    @Req() req: AuthenticatedRequest,
    @Query("groupId", new ParseIntPipe()) groupId: number
  ): Promise<SigFoxApiContractInfosContent[]> {
    const group: SigFoxGroup = await this.sigfoxGroupService.findOneWithPassword(groupId);
    checkIfUserHasAccessToOrganization(req, group?.belongsTo?.id, OrganizationAccessScope.ApplicationRead);

    return await this.service.getContractInfos(group);
  }
}
