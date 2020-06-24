import { Router, Request, Response, NextFunction } from "express";
import Logger from "../../loaders/logger";
import { getCustomRepository } from "typeorm";
import { UserRepository } from "../../repositoies/UserRepository";
import { BadRequest } from "http-errors";
import { celebrate, Joi, errors, Segments } from "celebrate";

const route = Router();

export default (app: Router): void => {
    app.use("/users", route);

    route.get(
        "/:userId",
        celebrate({
            [Segments.PARAMS]: {
                userId: Joi.number().integer().required(),
            },
        }),
        getUserById()
    );
    route.get("/", getAll());
    route.post(
        "/",
        celebrate({
            [Segments.BODY]: {
                firstName: Joi.string().required(),
                lastName: Joi.string().required(),
                age: Joi.number().integer(),
            },
        }),
        createUser()
    );
};
/**
 * @swagger
 * /users/{id}:
 *   get:
 *     description: Gets one user by id
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         description: users
 *         schema:
 *           type: object
 *           items:
 *             $ref: '#/definitions/User'
 */
function getUserById() {
    return (req: Request, res: Response) => {
        const userId = Number(req.params["userId"]);

        const userRepository = getCustomRepository(UserRepository);

        userRepository
            .findById(userId)
            .then((result) => {
                Logger.info(result.toString());
                return res.json({ user: result }).status(200);
            })
            .catch((err) => {
                Logger.error(err);
                return res.status(404).json({
                    error: `No user found for id: ${req.params["userId"]}`,
                });
            });
    };
}

/**
 * @swagger
 * /users:
 *   get:
 *     description: Returns all users as a list
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         description: users
 *         schema:
 *           type: array
 *           items:
 *             $ref: '#/definitions/User'
 */
function getAll() {
    return (req: Request, res: Response) => {
        const userRepository = getCustomRepository(UserRepository);
        userRepository
            .findAll()
            .then((result) => {
                return res.json({ users: result }).status(200);
            })
            .catch((err) => {
                throw err;
            });
    };
}

/**
 * @swagger
 * /users:
 *   post:
 *     description: Create a user
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         description: users
 *         schema:
 *           type: object
 *           items:
 *             $ref: '#/definitions/User'
 */
function createUser() {
    return async (req: Request, res: Response) => {
        Logger.info("createUser: '" + JSON.stringify(req.body) + "'");
        const userRepository = getCustomRepository(UserRepository);
        const user = await userRepository.createAndSave(req.body);
        return res.send(user).status(200);
    };
}
