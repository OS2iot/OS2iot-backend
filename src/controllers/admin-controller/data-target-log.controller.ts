import { DataTarget } from "@entities/data-target.entity";
import { DatatargetLog } from "@entities/datatarget-log.entity";
import { SendStatus } from "@enum/send-status.enum";
import { Controller, Get, Param, ParseIntPipe } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";

@ApiTags("Data Target Logs")
@Controller("datatarget-log")
export class DatatargetLogController {
  constructor() {}

  @Get(":datatargetId")
  async getDatatargetLogs(@Param("datatargetId", new ParseIntPipe()) datatargetId: number): Promise<DatatargetLog[]> {
    const datatarget: DataTarget = {
      id: datatargetId,
      application: undefined,
      connections: undefined,
      createdAt: new Date(),
      name: "Test CDJ dt",
      type: undefined,
      openDataDkDataset: undefined,
      updatedAt: undefined,
    };

    const arr: DatatargetLog[] = [];

    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    for (let i = 1; i < 55; i = i + 3) {
      arr.push({
        datatarget,
        id: i,
        createdAt: new Date(),
        updatedAt: new Date(),
        type: SendStatus.ERROR,
        message: "401 Unauth CDJ",
      });

      arr.push({
        datatarget,
        id: i + 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        type: SendStatus.ERROR,
        message: "500 Server CDJ",
      });

      arr.push({
        datatarget,
        id: i + 2,
        createdAt: new Date(),
        updatedAt: new Date(),
        type: SendStatus.OK,
        message: "200 OK CDJ",
      });

      await delay(100); /// waiting 1 second.
    }

    return arr;
  }
}
