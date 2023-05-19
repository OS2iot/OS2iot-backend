import { ApiProperty } from "@nestjs/swagger";
import {
    IsEnum,
    IsNumber,
    IsString,
    Matches,
    MinLength,
    ValidateIf,
} from "class-validator";
import { AuthenticationType } from "@enum/authentication-type.enum";

export class CreateMqttSubscriberSettingsDto {
    @ApiProperty({ required: true })
    @IsString()
    @Matches(/^mqtts?:\/\/\S+/, {
        message: "Der skal tilføjes protokol (mqtt/mqtts) på url",
    })
    mqttURL: string;

    @ApiProperty({ required: true })
    @IsNumber(undefined, { message: "Port skal udfyldes" })
    mqttPort: number;

    @ApiProperty({ required: true })
    @IsString()
    mqtttopicname: string;

    @ApiProperty({ required: true })
    @IsEnum(AuthenticationType, { message: "Der skal vælges en autentifikations type" })
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

    @ValidateIf(d => d.authenticationType === AuthenticationType.CERTIFICATE)
    @ApiProperty({ required: true })
    @IsString()
    @Matches(/^-----BEGIN CERTIFICATE-----([\s\S]*)-----END CERTIFICATE-----\s?$/, {
        message: "CA certifikatet mangler eller er forkert format",
    })
    caCertificate: string;

    @ValidateIf(d => d.authenticationType === AuthenticationType.CERTIFICATE)
    @ApiProperty({ required: true })
    @IsString()
    @Matches(/^-----BEGIN CERTIFICATE-----([\s\S]*)-----END CERTIFICATE-----\s?$/, {
        message: "Enheds certifikat mangler eller er forkert format",
    })
    deviceCertificate: string;

    @ValidateIf(d => d.authenticationType === AuthenticationType.CERTIFICATE)
    @ApiProperty({ required: true })
    @IsString()
    @Matches(/^-----([\s\S]*)-----\s?$/, {
        message: "Enhends certifikatnøgle mangler eller er forkert format",
    })
    deviceCertificateKey: string;
}
