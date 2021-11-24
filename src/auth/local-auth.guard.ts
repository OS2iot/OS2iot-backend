import { Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { LocalStrategyName } from "./constants";

@Injectable()
export class LocalAuthGuard extends AuthGuard(LocalStrategyName) {}
