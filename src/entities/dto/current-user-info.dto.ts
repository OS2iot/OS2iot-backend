import { Organization } from "@entities/organization.entity";
import { User } from "@entities/user.entity";

export class CurrentUserInfoDto {
  user: User;
  organizations: Organization[];
}
