import { Organization } from "@entities/organization.entity";
import { ApiProperty } from "@nestjs/swagger";
import { ArrayMinSize, IsEmail, IsNotEmpty } from "class-validator";

export class CreateNewKombitUserDto {
    @ApiProperty({ required: true })
    @IsEmail()
    @IsNotEmpty()
    email: string;
    
    @ArrayMinSize(1)
    organizations: Organization[];
}
