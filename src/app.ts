import cookieParser from "cookie-parser";
import cors from "cors";
import express, { type Application } from "express";

import globalErrorHandler from "./middleware/globalErrorHandler";

import { authRoute } from "./modules/auth/auth.route";

import { issueRoutes } from "./modules/issue/issue.route";

const app: Application = express();

app.use(express.json());

app.use(cookieParser());

app.use(
  cors({
    origin: true, // request origin automatically allow
    credentials: true,
  }),
);

app.get("/", (_, res) => {
  res.send("Level_2_Assignment_2");
});

app.use("/api/auth", authRoute);

app.use("/api/issues", issueRoutes);

// If not found route
app.use("*", (_, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

app.use(globalErrorHandler);

export default app;
