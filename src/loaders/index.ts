import expressLoader from './express';
import typeormLoader from './typeorm';
import Logger from './logger';
import { Express } from 'express'
//We have to import at least all the events once so they can be triggered
// import './events';

export default async ({ expressApp }: { expressApp: Express }): Promise<void> => {
    await expressLoader({ app: expressApp });
    Logger.info('✌️ Express loaded');

    await typeormLoader();
    Logger.info('✌️ TypeORM loaded');
};
