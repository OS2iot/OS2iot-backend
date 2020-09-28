import { ApiPropertyOptional, OmitType } from "@nestjs/swagger";

import { CreateUserDto } from "./create-user.dto";

export class UpdateUserDto extends OmitType(CreateUserDto, ["password"]) {
    @ApiPropertyOptional()
    password?: string;
}
