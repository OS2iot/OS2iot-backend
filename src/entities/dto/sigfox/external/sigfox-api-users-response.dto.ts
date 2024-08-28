import { SigFoxApiIdReferenceDto } from "./sigfox-api-id-reference.dto";

export interface SigFoxApiUsersResponseDto {
  data: SigFoxApiUsersContent[];
}

export interface SigFoxApiUsersContent {
  id: string;
  group: SigFoxApiIdReferenceDto;
  name: string;
  timezone: string;
  creationTime: any;
  profiles: SigFoxApiIdReferenceDto[];
  accessToken: string;
}
