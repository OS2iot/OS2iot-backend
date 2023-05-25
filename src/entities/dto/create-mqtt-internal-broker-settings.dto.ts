import { AuthenticationType } from "@enum/authentication-type.enum";
import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsString, MinLength, ValidateIf } from "class-validator";

export class CreateMqttInternalBrokerSettingsDto {
    @ApiProperty({ required: true })
    @IsEnum(AuthenticationType)
    authenticationType: AuthenticationType;

    @ValidateIf(d => d.authenticationType === AuthenticationType.PASSWORD)
    @ApiProperty({ required: true })
    @IsString()
    @MinLength(1)
    mqttusername: string;

    @ValidateIf(d => d.authenticationType === AuthenticationType.PASSWORD)
    @ApiProperty({ required: true })
    @IsString()
    @MinLength(1)
    mqttpassword: string;
}
