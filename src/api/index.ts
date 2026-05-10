import serverless from "serverless-http";
import app from "../app";

let handler: any;

const serverlessHandler = serverless(app, {
  binary: ['*/*']
});

export default async function(req: any, res: any) {
  if (!handler) {
    handler = serverlessHandler;
  }
  
  res.setHeader('Connection', 'close');
  
  return handler(req, res);
}