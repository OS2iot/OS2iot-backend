import { CreateUserDto } from "./create-user.dto";
import { OmitType, ApiPropertyOptional } from "@nestjs/swagger";

export class UpdateUserDto extends OmitType(CreateUserDto, ["password"]) {
    @ApiPropertyOptional()
    password?: string;
}
