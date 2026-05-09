import { NextFunction, Request, Response } from 'express';

type AsyncRouteHandler<B = any, Res = any, T = Request<any, any, B>> = (req: T, res: Response<Res, Record<string, any>>, next: NextFunction) => Promise<unknown>;

export const asyncHandler = <B = any, Res = any>(handler: AsyncRouteHandler<B, Res>) => {
  return (req: Request<any, any, B>, res: Response<Res, Record<string, any>>, next: NextFunction) => {
    void handler(req, res, next).catch(next);
  };
};
