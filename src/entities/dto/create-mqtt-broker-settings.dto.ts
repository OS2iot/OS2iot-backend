import {AuthenticationType} from "@enum/authentication-type";
import {ApiProperty} from "@nestjs/swagger";
import {IsEnum, IsString, ValidateIf} from "class-validator";

export class CreateMqttBrokerSettingsDto {
    @ApiProperty({required: true})
    @IsEnum(AuthenticationType)
    authenticationType: AuthenticationType;

    @ValidateIf(d => d.authenticationType === AuthenticationType.PASSWORD)
    @ApiProperty({required: true})
    @IsString()
    username: string;

    @ValidateIf(d => d.authenticationType === AuthenticationType.PASSWORD)
    @ApiProperty({required: true})
    @IsString()
    password: string;
}
