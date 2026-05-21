import type { Request, Response } from "express";
import { authService } from "./auth.service";
import sendResponse from "../../utils/sendResponse";

export const signup = async (req: Request, res: Response) => {
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

export const login = async (req: Request, res: Response) => {};
