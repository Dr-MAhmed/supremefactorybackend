import { Request, Response, NextFunction } from 'express';

type AsyncRouteHandler<B = any, P = any, Q = any> = (
  req: Request<P, any, B, Q>,
  res: Response,
  next: NextFunction
) => Promise<unknown>;

export const asyncHandler = <B = any, P = any, Q = any>(handler: AsyncRouteHandler<B, P, Q>) => {
  return (req: Request<P, any, B, Q>, res: Response, next: NextFunction) => {
    void handler(req, res, next).catch(next);
  };
};