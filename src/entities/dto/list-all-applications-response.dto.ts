import { ListAllEntitiesResponseDto } from "@dto/list-all-entities-response.dto";
import { Application } from "@entities/application.entity";

export type ApplicationWithStatus = Application & { statusCheck?: "stable" | "alert" };

export class ListAllApplicationsWithStatusResponseDto extends ListAllEntitiesResponseDto<ApplicationWithStatus> {}
export class ListAllApplicationsResponseDto extends ListAllEntitiesResponseDto<Application> {}
