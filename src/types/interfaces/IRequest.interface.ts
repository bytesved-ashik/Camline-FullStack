import { Request } from 'express';
import { IUserDocument } from '@interfaces';
import { ROLE } from '../enums';

interface IRequest extends Request {
  user: IUserDocument & { role: ROLE };
}

export { IRequest };
