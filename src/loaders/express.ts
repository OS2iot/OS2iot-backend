import { Application, Request, Response, NextFunction } from 'express';
import { HttpError, NotFound, InternalServerError } from "http-errors";
import bodyParser from 'body-parser';
import cors from 'cors';
import routes from '../api';
import config from '../config';
import Logger from '../loaders/logger';
import swagger from './swagger';


export default ({ app }: { app: Application }): void => {
    /**
     * Health Check endpoints
     * 
     * These are used to check if the container is alive by k8s etc.
     */
    app.get('/status', (req, res) => {
        res.status(200).end();
    });
    app.head('/status', (req, res) => {
        res.status(200).end();
    });

    // Useful if you're behind a reverse proxy (Heroku, Bluemix, AWS ELB, Nginx, etc)
    // It shows the real origin IP in the heroku or Cloudwatch logs
    app.enable('trust proxy');

    // The magic package that prevents frontend developers going nuts
    // Alternate description:
    // Enable Cross Origin Resource Sharing to all origins by default
    app.use(cors());

    // Some sauce that always add since 2014
    // "Lets you use HTTP verbs such as PUT or DELETE in places where the client doesn't support it."
    // Maybe not needed anymore ?
    // app.use(require('method-override')());

    // Middleware that transforms the raw string of req.body into json
    app.use(bodyParser.json());
    // Load API routes
    app.use(config.api.prefix, routes());
    app.use(config.api.prefix + config.api.docsprefix, swagger())

    // catch 404 and forward to error handler
    app.use((req, res, next) => {
        const err = new NotFound('Not Found');
        return next(err);
    });

    // error handlers
    app.use((err: HttpError, req: Request, res: Response, next: NextFunction) => {
        /**
         * Handle 401 thrown by express-jwt library
         */
        if (err.name === 'UnauthorizedError') {
            return res
                .status(Number(err.status))
                .send({ message: err.message })
                .end();
        }
        return next(err);
    });

    // 500 Server Error
    app.use((err: unknown, req: Request, res: Response, next: NextFunction) => {
        Logger.error(err)
        if (!(err instanceof HttpError)) {
            err = new InternalServerError();
        }

        if (err instanceof HttpError) {
            res.status(err.statusCode);
            res.json({ error: err });
        }
        return next();
    });
};