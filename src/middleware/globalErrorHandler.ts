import type {
  NextFunction,
  Request,
  Response,
} from "express";
import config from "../config";

const globalErrorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = 500;
  let message =
    "Internal Server Error";

  if (
    err instanceof Error
  ) {
    message =
      err.message;

    if (
      err.message ===
      "User not found"
    ) {
      statusCode = 404;
    }

    else if (
      err.message ===
      "Issue not found"
    ) {
      statusCode = 404;
    }

    else if (
      err.message ===
      "Invalid password!"
    ) {
      statusCode = 401;
    }

    else if (
      err.message.includes(
        "Unauthorized"
      )
    ) {
      statusCode = 401;
    }
  }

  if (
    typeof err ===
      "object" &&
    err !== null &&
    "code" in err &&
    err.code === "23505"
  ) {
    statusCode = 409;
    message =
      "Email already exists";
  }

  res.status(statusCode).json({
    success: false,
    message,
    stack:
      config.node_env ===
        "development" &&
      err instanceof Error
        ? err.stack
        : undefined,
  });
};

export default globalErrorHandler;