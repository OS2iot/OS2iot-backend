import { ApiHideProperty, ApiProperty } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsHexadecimal,
  IsInt,
  IsOptional,
  IsPhoneNumber,
  IsString,
  Length,
  Matches,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
  ValidateNested,
} from "class-validator";
import { CommonLocationDto } from "@dto/chirpstack/common-location.dto";
import { GatewayPlacement, GatewayStatus } from "@enum/gateway.enum";
import { isNullOrWhitespace } from "@helpers/string.helper";
import { IsJSONOrNull } from "@helpers/is-json-or-null.validator";
import { nameof } from "@helpers/type-helper";

export class GatewayContentsDto {
  @ApiProperty({ required: true })
  @IsOptional()
  @IsString()
  @MaxLength(1024)
  description?: string;

  @ApiProperty({ required: false, default: false })
  @IsOptional()
  discoveryEnabled: boolean;

  @ApiProperty({ required: true })
  @IsString()
  @IsHexadecimal()
  @Length(16, 16)
  @Transform(({ value }) => value.toLowerCase())
  gatewayId: string;

  @ApiProperty({ required: false })
  @ValidateNested({ each: true })
  @Type(() => CommonLocationDto)
  location: CommonLocationDto;

  @ApiProperty({ required: false })
  metadata?: JSON;

  @ApiProperty({ required: true })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  @Matches(/^[a-zA-Z0-9\-_]+$/, {
    message: "The name may only contain words, numbers and dashes.",
  })
  name: string;

  @ApiProperty({ required: false })
  @IsEnum(GatewayPlacement)
  @IsOptional()
  placement?: GatewayPlacement;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  modelName?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  antennaType?: string;

  @ApiProperty({ required: false })
  @IsEnum(GatewayStatus)
  @IsOptional()
  status?: GatewayStatus;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  gatewayResponsibleName?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  @ValidateIf(value => !isNullOrWhitespace(value.gatewayResponsibleEmail))
  @IsEmail()
  gatewayResponsibleEmail?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  @ValidateIf(value => !isNullOrWhitespace(value.gatewayResponsiblePhoneNumber))
  @IsPhoneNumber("DK")
  gatewayResponsiblePhoneNumber?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  operationalResponsibleName?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  @ValidateIf(value => !isNullOrWhitespace(value.operationalResponsibleEmail))
  @IsEmail()
  operationalResponsibleEmail?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  notifyOffline?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  notifyUnusualPackages?: boolean;

  @ApiProperty({ required: false })
  @Min(1)
  @IsInt()
  @ValidateIf(value => value.notifyOffline)
  offlineAlarmThresholdMinutes?: number;

  @ApiProperty({ required: false })
  @Min(0)
  @IsInt()
  @ValidateIf(value => value.notifyUnusualPackages)
  minimumPackages?: number;

  @ApiProperty({ required: false })
  @Min(0)
  @IsInt()
  @ValidateIf(value => value.notifyUnusualPackages)
  maximumPackages?: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsEmail()
  @ValidateIf(value => (value.notifyOffline || value.notifyUnusualPackages) && !value.alarmMail)
  alarmMail?: string;

  @ApiHideProperty()
  tenantId: string;

  @ApiProperty({ required: false })
  @IsJSONOrNull(nameof<GatewayContentsDto>("tagsString"))
  tagsString?: string;

  @ApiHideProperty()
  tags?: { [id: string]: string };

  @ApiHideProperty()
  id: string;
}
