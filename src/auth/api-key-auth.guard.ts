import { Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ApiKeyStrategyName } from "./constants";

@Injectable()
export class ApiKeyAuthGuard extends AuthGuard(ApiKeyStrategyName) {}
