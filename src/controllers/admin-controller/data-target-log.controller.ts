import { ComposeAuthGuard } from "@auth/compose-auth.guard";
import { Read } from "@auth/roles.decorator";
import { RolesGuard } from "@auth/roles.guard";
import { ApiAuth } from "@auth/swagger-auth-decorator";
import { DatatargetLog } from "@entities/datatarget-log.entity";
import { Controller, Get, Param, ParseIntPipe, UseGuards } from "@nestjs/common";
import { ApiForbiddenResponse, ApiTags, ApiUnauthorizedResponse } from "@nestjs/swagger";
import { InjectRepository } from "@nestjs/typeorm";
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
    private datatargetLogRepository: Repository<DatatargetLog>
  ) {}

  @Get(":datatargetId")
  async getDatatargetLogs(@Param("datatargetId", new ParseIntPipe()) datatargetId: number): Promise<DatatargetLog[]> {
    return await this.datatargetLogRepository.find({
      where: {
        datatarget: { id: datatargetId },
      },
      relations: ["iotDevice"],
    });
  }
}
