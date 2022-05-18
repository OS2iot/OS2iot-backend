import { ApiProperty } from "@nestjs/swagger";
import { ArrayMinSize, IsEmail, IsNotEmpty } from "class-validator";

export class CreateNewKombitUserDto {
    @ApiProperty({ required: true })
    @IsEmail()
    @IsNotEmpty()
    email: string;
    
    @ApiProperty({ required: true })
    @ArrayMinSize(1)
    requestedOrganizationIds: number[];
}
