import dotenv from "dotenv";
dotenv.config();

const config = {
  connection_string: process.env.CONNECTION_STRING as string,
  port: Number(process.env.PORT) || 5000,
  jwt_secret: process.env.JWT_SECRET as string,
  refresh_secret: process.env.REFRESH_SECRET as string,
  node_env: process.env.NODE_ENV || "development",
};

export default config;
