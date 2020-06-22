import { Router, Request, Response } from 'express';
import middlewares from '../middlewares';
import UserService from '../../services/UserService'
import Logger from '../../loaders/logger';


const route = Router();

export default (app: Router) => {
  app.use('/users', route);

  route.get('/me', middlewares.isAuth, (req: Request, res: Response) => {
    return res.json({ user: 'asdf' }).status(200);
  });

  route.get('/:userId', (req: Request, res: Response) => {
    let userId = Number(req.params['userId'])
    let service = new UserService()
    service.fetchUserById(userId).then(result => {
      Logger.info(result.toString())
      return res.json({ user: result}).status(200);
    }).catch(err => {
      return res.status(404).json({ error: `No user found for id: ${req.params['userId']}`})
    })
  });
};
