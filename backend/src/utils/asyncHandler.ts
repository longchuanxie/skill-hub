import { NextFunction, Request, RequestHandler, Response } from 'express';

// Wrap an async route handler so rejections propagate to the express
// error middleware instead of leaving the request hanging.
const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    fn(req, res, next).catch(next);
  };

export default asyncHandler;
