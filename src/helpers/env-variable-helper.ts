import { LogLevel } from '@nestjs/common';

const logLevels: LogLevel[] = ['log', 'error', 'warn', 'debug', 'verbose'];

// Gets a list of log levels equal to, or higher, than the supplied minimum level
export function GetLogLevels(minLevel: string): LogLevel[] {
	// If nothing was supplied, use default values
	if (!minLevel) {
		return undefined;
	}

	const logIndex = logLevels.indexOf(minLevel as LogLevel);	
	if (logIndex < 0) {
		throw new Error(`Invalid log level specified: ${minLevel} supplied in environment`);
	}

	const higherLevels = logLevels.slice(0, logIndex + 1);

	// We want to return all the HIGHER log levels and they are ranked high->low
	return higherLevels;
}