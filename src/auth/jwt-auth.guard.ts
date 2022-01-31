import { Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { JwtStrategyName } from "./constants";

@Injectable()
export class JwtAuthGuard extends AuthGuard(JwtStrategyName) {}
