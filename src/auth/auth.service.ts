import { Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcryptjs";
import { UserResponseDto } from "@entities/dto/user-response.dto";
import { JwtReponseDto } from "@dto/jwt-response.dto";
import { UserService } from "../user/user.service";
import { ErrorCodes } from "../entities/enum/error-codes.enum";

@Injectable()
export class AuthService {
    constructor(
        private usersService: UserService,
        private jwtService: JwtService
    ) {}
    private readonly logger = new Logger(AuthService.name);

    async validateUser(
        username: string,
        password: string
    ): Promise<UserResponseDto> {
        const user = await this.usersService.findOneUserByEmailWithPassword(
            username
        );
        if (user) {
            if (!user.active) {
                throw new UnauthorizedException(ErrorCodes.UserInactive);
            }

            const res = await bcrypt.compare(password, user.passwordHash);
            if (res === true) {
                this.usersService.updateLastLogin(user);
                const { passwordHash, ...result } = user;
                return result;
            } else {
                this.logger.warn(
                    `Login with user: '${username}' used wrong password`
                );
            }
        } else {
            this.logger.warn(`Login with non-existing user: '${username}'`);
        }
        return null;
    }

    async issueJwt(email: string, id: number): Promise<JwtReponseDto> {
        const payload = { username: email, sub: id };
        return {
            accessToken: this.jwtService.sign(payload),
        };
    }
}
