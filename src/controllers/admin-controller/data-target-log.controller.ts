import { DatatargetLog } from "@entities/datatarget-log.entity";
import { Controller, Get, Param, ParseIntPipe } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

@ApiTags("Data Target Logs")
@Controller("datatarget-log")
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
