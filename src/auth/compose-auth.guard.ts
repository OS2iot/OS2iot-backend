import { Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ApiKeyStrategyName, JwtStrategyName } from "./constants";

@Injectable()
/**
 * Let authentication go through a chain of strategies. The first to succeed, redirect, or error will halt the chain
 * If a strategy fails (not errors! Ex. JWT token wasn't valid), then authentication proceeds to the next strategy.
 * Source: https://docs.nestjs.com/security/authentication#extending-guards
 */
export class ComposeAuthGuard extends AuthGuard([JwtStrategyName, ApiKeyStrategyName]) {}
