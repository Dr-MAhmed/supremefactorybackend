import serverless from "serverless-http";
import app from "../app";

const handler = serverless(app);

export default async (req: any, res: any) => {
  const result = await handler(req, res);
  return result;
};