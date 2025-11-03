import { ComposeAuthGuard } from "@auth/compose-auth.guard";
import { Read } from "@auth/roles.decorator";
import { RolesGuard } from "@auth/roles.guard";
import { ApiAuth } from "@auth/swagger-auth-decorator";
import { AuthenticatedRequest } from "@dto/internal/authenticated-request";
import { DatatargetLog } from "@entities/datatarget-log.entity";
import { ApplicationAccessScope, checkIfUserHasAccessToApplication } from "@helpers/security-helper";
import { Controller, Get, Param, ParseIntPipe, Req, UseGuards } from "@nestjs/common";
import { ApiForbiddenResponse, ApiTags, ApiUnauthorizedResponse } from "@nestjs/swagger";
import { InjectRepository } from "@nestjs/typeorm";
import { DataTargetService } from "@services/data-targets/data-target.service";
import { Repository } from "typeorm";

@ApiTags("Data Target Logs")
@Controller("datatarget-log")
@UseGuards(ComposeAuthGuard, RolesGuard)
@ApiAuth()
@Read()
@ApiForbiddenResponse()
@ApiUnauthorizedResponse()
export class DatatargetLogController {
  constructor(
    @InjectRepository(DatatargetLog)
    private datatargetLogRepository: Repository<DatatargetLog>,
    private dataTargetService: DataTargetService
  ) {}

  @Get(":datatargetId")
  async getDatatargetLogs(
    @Req() req: AuthenticatedRequest,
    @Param("datatargetId", new ParseIntPipe()) datatargetId: number
  ): Promise<DatatargetLog[]> {
    const dataTarget = await this.dataTargetService.findOne(datatargetId);
    checkIfUserHasAccessToApplication(req, dataTarget.application.id, ApplicationAccessScope.Read);

    return await this.datatargetLogRepository.find({
      where: {
        datatarget: { id: datatargetId },
      },
      relations: ["iotDevice"],
    });
  }
}
