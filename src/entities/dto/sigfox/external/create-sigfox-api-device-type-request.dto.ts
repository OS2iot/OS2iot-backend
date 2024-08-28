import { SigFoxDownlinkMode, SigFoxPayloadType } from "@enum/sigfox.enum";
import { ApiHideProperty, ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEmail, IsOptional, MaxLength, MinLength } from "class-validator";

export class CreateSigFoxApiDeviceTypeRequestDto {
  @ApiProperty({ required: true })
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @ApiProperty({ required: true })
  contractId: string;

  @ApiProperty({ required: true })
  @MaxLength(300)
  description: string;

  @ApiPropertyOptional()
  keepAlive?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  alertEmail?: string;

  /* This is required, but is set by the backend. */
  @ApiHideProperty()
  groupId?: string;

  @ApiHideProperty()
  automaticRenewal?: boolean;

  @ApiHideProperty()
  geolocPayloadConfigId?: string;

  @ApiHideProperty()
  downlinkMode?: SigFoxDownlinkMode;

  @ApiHideProperty()
  downlinkDataString?: string;

  @ApiHideProperty()
  payloadType?: SigFoxPayloadType;

  @ApiHideProperty()
  payloadConfig?: string;
}
