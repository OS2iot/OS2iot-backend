import { Cron, CronExpression } from "@nestjs/schedule";
import { UserService } from "@services/user-management/user.service";
import { Injectable } from "@nestjs/common";

@Injectable()
export class TemporaryAccessService {
  constructor(private userService: UserService) {}

  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async expireAccess() {
    await this.userService.disableExpiredUsers();
  }
}
