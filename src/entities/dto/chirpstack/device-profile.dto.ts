import { MacVersionMap, RegParamsRevisionMap } from "@chirpstack/chirpstack-api/common/common_pb";
import { ApiHideProperty, ApiProperty } from "@nestjs/swagger";
import { IsInt, IsNotEmpty, IsOptional, IsString, Length, Min, ValidateIf } from "class-validator";

export class DeviceProfileDto {
    @ApiProperty({ required: true })
    @IsString()
    @Length(1, 1024)
    name: string;

    @ApiProperty({ required: true })
    @IsNotEmpty()
    macVersion: MacVersionMap[keyof MacVersionMap];

    @ApiProperty({ required: true })
    @IsNotEmpty()
    regParamsRevision: RegParamsRevisionMap[keyof RegParamsRevisionMap];

    @ApiProperty({ required: false })
    @IsString()
    adrAlgorithmID?: string;

    @ApiProperty({ required: false })
    @ValidateIf((o: DeviceProfileDto) => o.supportsClassB)
    @Min(0)
    @IsInt()
    classBTimeout?: number;

    @ApiProperty({ required: false })
    @Min(0)
    @IsInt()
    classCTimeout?: number;

    @ApiProperty({ required: false })
    id?: string;

    @ApiProperty({ required: false })
    @ValidateIf((o: DeviceProfileDto) => o.supportsClassB)
    @Min(0)
    @IsInt()
    pingSlotDR?: number;

    @ApiProperty({ required: false })
    @ValidateIf((o: DeviceProfileDto) => o.supportsClassB)
    @Min(0)
    @IsInt()
    pingSlotFreq?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    pingSlotPeriod?: number;

    @ApiProperty({ required: false })
    rfRegion?: string;

    @ApiProperty({ required: false })
    @ValidateIf((o: DeviceProfileDto) => o.supportsJoin == false)
    @Min(0)
    @IsInt()
    rxDROffset1?: number;

    @ApiProperty({ required: false })
    @ValidateIf((o: DeviceProfileDto) => o.supportsJoin == false)
    @Min(0)
    @IsInt()
    rxDataRate2?: number;

    @ApiProperty({ required: false })
    @ValidateIf((o: DeviceProfileDto) => o.supportsJoin == false)
    @Min(0)
    @IsInt()
    rxDelay1?: number;

    @ApiProperty({ required: false })
    @ValidateIf((o: DeviceProfileDto) => o.supportsJoin == false)
    @Min(0)
    @IsInt()
    rxFreq2?: number;

    @ApiProperty({ required: false })
    supportsClassB?: boolean;

    @ApiProperty({ required: false })
    supportsClassC?: boolean;

    @ApiProperty({ required: false })
    supportsJoin?: boolean;

    @ApiProperty({ required: false })
    devStatusReqFreq?: number;

    @ApiHideProperty()
    tags?: { [id: string]: string };

    @ApiHideProperty()
    tagsMap?: Array<[string, string]>;

    @ApiHideProperty()
    internalOrganizationId?: number;

    @ApiHideProperty()
    updatedBy?: number;

    @ApiHideProperty()
    createdBy?: number;

    @ApiHideProperty()
    organizationID?: string;
}
