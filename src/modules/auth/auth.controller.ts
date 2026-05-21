import type { Request, Response } from "express";
import { authService } from "./auth.service";
import sendResponse from "../../utils/sendResponse";

const signup = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role } = req.body;
    const user = await authService.signUpUser({ name, email, password, role });
    if (!user) {
      sendResponse(res, {
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
  } catch (error: any) {
    sendResponse(res, {
      statusCode: 500,
      success: false,
      message: error.message,
      error: error,
    });
  }
};

const login = async (req: Request, res: Response) => {
  try {
    const result = await authService.logInUser(req.body);

    const { token, refreshToken, user } = result;

    res.cookie("refreshToken", refreshToken, {
      secure: false, // In production => True
      httpOnly: true,
      sameSite: "lax",
    });
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Login successfully!",
      data: { token, user },
    });
  } catch (error: any) {
    sendResponse(res, {
      statusCode: 500,
      success: false,
      message: error.message,
      error: error,
    });
  }
};

const refreshToken = async (req: Request, res: Response) => {
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
  } catch (error: any) {
    sendResponse(res, {
      statusCode: 500,
      success: false,
      message: error.message,
      error: error,
    });
  }
};

export const authController = {
  signup,
  login,
  refreshToken,
};
