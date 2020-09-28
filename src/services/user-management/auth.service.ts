import { Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcryptjs";

import { JwtReponseDto } from "@dto/jwt-response.dto";
import { UserResponseDto } from "@dto/user-response.dto";
import { JwtPayloadDto } from "@entities/dto/internal/jwt-payload.dto";
import { ErrorCodes } from "@entities/enum/error-codes.enum";

import { UserService } from "./user.service";

@Injectable()
export class AuthService {
    constructor(private usersService: UserService, private jwtService: JwtService) {}
    private readonly logger = new Logger(AuthService.name);

    async validateUser(username: string, password: string): Promise<UserResponseDto> {
        const user = await this.usersService.findOneUserByEmailWithPassword(username);
        if (user) {
            if (!user.active) {
                throw new UnauthorizedException(ErrorCodes.UserInactive);
            }

            const res = await bcrypt.compare(password, user.passwordHash);
            if (res === true) {
                await this.usersService.updateLastLoginToNow(user);
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { passwordHash, ...result } = user;
                return result;
            } else {
                this.logger.warn(`Login with user: '${username}' used wrong password`);
            }
        } else {
            this.logger.warn(`Login with non-existing user: '${username}'`);
        }
        return null;
    }

    async issueJwt(email: string, id: number): Promise<JwtReponseDto> {
        const payload: JwtPayloadDto = { username: email, sub: id };
        return {
            accessToken: this.jwtService.sign(payload),
        };
    }
}
