import {AuthenticationType} from "@enum/authentication-type";
import {ApiProperty} from "@nestjs/swagger";
import {IsEnum} from "class-validator";

export class CreateMqttBrokerSettingsDto {
    @ApiProperty({required: false})
    @IsEnum(AuthenticationType)
    authenticationType: AuthenticationType;
}
