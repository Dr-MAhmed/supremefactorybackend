import { NextFunction, Request, Response } from 'express';

type AsyncRouteHandler<T = Request> = (req: T, res: Response, next: NextFunction) => Promise<unknown>;

export const asyncHandler = <T extends Request = Request>(handler: AsyncRouteHandler<T>) => {
  return (req: T, res: Response, next: NextFunction) => {
    void handler(req, res, next).catch(next);
  };
};
