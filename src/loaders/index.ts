import expressLoader from './express';
import typeormLoader from './typeorm';
import Logger from './logger';
//We have to import at least all the events once so they can be triggered
// import './events';

export default async ({ expressApp }: { expressApp: any }) => {
    await expressLoader({ app: expressApp });
    Logger.info('✌️ Express loaded');

    await typeormLoader();
    Logger.info('✌️ TypeORM loaded');
};
