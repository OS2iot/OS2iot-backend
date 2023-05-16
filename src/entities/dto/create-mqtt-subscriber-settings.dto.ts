import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsNumber, IsString, Matches, ValidateIf } from "class-validator";
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
    mqttusername: string;

    @ValidateIf(d => d.authenticationType === AuthenticationType.PASSWORD)
    @ApiProperty({ required: true })
    @IsString()
    mqttpassword: string;

    @ValidateIf(d => d.authenticationType === AuthenticationType.CERTIFICATE)
    @ApiProperty({ required: true })
    @IsString()
    @Matches(/^-----BEGIN CERTIFICATE-----([\s\S]*)-----END CERTIFICATE-----\s?$/, {
        message: "CA certifikatet er forkert format",
    })
    caCertificate: string;

    @ValidateIf(d => d.authenticationType === AuthenticationType.CERTIFICATE)
    @ApiProperty({ required: true })
    @IsString()
    @Matches(/^-----BEGIN CERTIFICATE-----([\s\S]*)-----END CERTIFICATE-----\s?$/, {
        message: "Enheds certifikatet er forkert format",
    })
    deviceCertificate: string;

    @ValidateIf(d => d.authenticationType === AuthenticationType.CERTIFICATE)
    @ApiProperty({ required: true })
    @IsString()
    @Matches(/^-----([\s\S]*)-----\s?$/, {
        message: "Enhends certifikatnøglen er forkert format",
    })
    deviceCertificateKey: string;
}
