import dotenv from "dotenv";
import { env } from "process";
dotenv.config({ quiet: true });

const config = {
  connection_string: env.CONNECTION_STRING as string,
  port: env.PORT as string,
  jwt_secret: env.JWT_SECRET as string,
  refresh_secret: env.REFRESH_SECRET as string,
  node_env: env.NODE_ENV as string,
};

export default config;
