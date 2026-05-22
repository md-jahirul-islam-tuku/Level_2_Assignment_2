import type { NextFunction, Request, Response } from "express";
import { authService } from "./auth.service";
import sendResponse from "../../utils/sendResponse";
import config from "../../config";

const signup = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, password, role } = req.body;
    const user = await authService.signUpUser({ name, email, password, role });
    if (!user) {
      return sendResponse(res, {
        statusCode: 400,
        success: false,
        message: "Failed to register user !!",
      });
    }
    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: "User registered successfully",
      data: user.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await authService.logInUser(req.body);

    const { token, refreshToken, user } = result;

    res.cookie("refreshToken", refreshToken, {
      secure: config.node_env === "production",
      httpOnly: true,
      sameSite: "lax",
    });
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Login successful",
      data: { token, user },
    });
  } catch (error) {
    next(error);
  }
};

const refreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await authService.generateRefreshToken(
      req.cookies.refreshToken,
    );
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Access token generated!",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const authController = {
  signup,
  login,
  refreshToken,
};
