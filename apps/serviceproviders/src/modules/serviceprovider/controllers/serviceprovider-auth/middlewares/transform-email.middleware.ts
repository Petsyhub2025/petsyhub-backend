import { NextFunction, Request, Response } from 'express';

export function transformRequestEmails(req: Request, res: Response, next: NextFunction) {
  if (req.body.email) {
    req.body.email = req.body.email.toLowerCase();
  }

  next();
}
