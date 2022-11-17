import { CreateOpenDataDkDatasetDto } from "@dto/create-open-data-dk-dataset.dto";
import { DataTargetType } from "@enum/data-target-type.enum";
import { QoS } from "@enum/qos.enum";
import { IsNotBlank } from "@helpers/is-not-blank.validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
    IsEnum,
    IsInt,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    IsUrl,
    MaxLength,
    Min,
    MinLength,
    ValidateIf,
    ValidateNested,
} from "class-validator";

export class CreateDataTargetDto {
    @ApiProperty({ required: true })
    @IsString()
    @MinLength(1)
    @MaxLength(50)
    name: string;

    @ApiProperty({ required: false, default: "" })
    tenant: string;

    @ApiProperty({ required: false, default: "", example: null })
    context: string;

    @ApiProperty({ required: true, example: 1 })
    @IsNumber()
    @Min(1)
    applicationId: number;

    @ApiProperty({ required: true })
    type: DataTargetType;

    @ApiProperty({ required: true, example: "https://example.com/endpoint" })
    @IsString()
    @MaxLength(1024)
    @IsNotBlank("url")
    @IsUrl({
        require_tld: false,
        require_protocol: true,
        protocols: ["http", "https", "mqtt", "mqtts"],
    })
    url: string;

    @ApiProperty({ required: true, example: 30000 })
    @IsInt()
    timeout: number;

    @ApiProperty({ required: false, default: "", example: null })
    authorizationHeader: string;

    @ApiProperty({ required: false })
    tokenEndpoint?: string;

    @ApiProperty({ required: false })
    clientId?: string;

    @ApiProperty({ required: false })
    clientSecret?: string;

    @ApiPropertyOptional({ required: false })
    @IsOptional()
    @ValidateNested({ each: true })
    @Type(() => CreateOpenDataDkDatasetDto)
    openDataDkDataset?: CreateOpenDataDkDatasetDto;

    @ApiPropertyOptional({ required: false, description: "Required for MQTT datatarget" })
    @ValidateIf((obj: CreateDataTargetDto) => obj.type === DataTargetType.MQTT)
    @Type(() => Number)
    @IsInt()
    @Min(1025) // Don't allow priviliged ports
    mqttPort?: number;

    @ApiPropertyOptional({ required: false, description: "Required for MQTT datatarget" })
    @ValidateIf((obj: CreateDataTargetDto) => obj.type === DataTargetType.MQTT)
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    mqttTopic?: string;

    @ApiPropertyOptional({ required: false, description: "Required for MQTT datatarget" })
    @ValidateIf((obj: CreateDataTargetDto) => obj.type === DataTargetType.MQTT)
    @IsEnum(QoS)
    mqttQos?: QoS;

    @ApiPropertyOptional({ required: false, description: "Required for MQTT datatarget" })
    @ValidateIf((obj: CreateDataTargetDto) => obj.type === DataTargetType.MQTT)
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    mqttUsername?: string;

    @ApiPropertyOptional({ required: false, description: "Required for MQTT datatarget" })
    @ValidateIf((obj: CreateDataTargetDto) => obj.type === DataTargetType.MQTT)
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    mqttPassword?: string;
}
