import { ApiHideProperty, ApiProperty } from "@nestjs/swagger";
import {
    IsNumber,
    IsOptional,
    IsString,
    Matches,
    MaxLength,
    ValidateIf,
} from "class-validator";

export class CreateSigFoxSettingsDto {
    @ApiProperty({ required: true })
    @IsString()
    @MaxLength(8)
    @Matches(/[0-9A-Fa-f]{1,8}/)
    deviceId: string;

    @ApiProperty({ required: false })
    @ValidateIf(o => !o.connectToExistingDeviceInBackend)
    @IsString()
    @MaxLength(24)
    @Matches(/[0-9A-Fa-f]{1,24}/)
    deviceTypeId?: string;

    @ApiHideProperty()
    deviceTypeName?: string;

    @ApiProperty({ required: true })
    @IsNumber()
    groupId: number;

    @ApiHideProperty()
    groupName?: string;

    @ApiProperty({ required: false })
    connectToExistingDeviceInBackend?: boolean;

    @ApiProperty({ required: false })
    @ValidateIf(o => !o.connectToExistingDeviceInBackend)
    @IsString()
    @Matches(/[0-9A-Fa-f]+/)
    pac?: string;

    @ApiProperty({ required: false })
    @ValidateIf(o => !o.connectToExistingDeviceInBackend && !o?.prototype)
    @IsString()
    endProductCertificate?: string;

    @ApiProperty({ required: false })
    prototype?: boolean;
}
