import jwt, { type JwtPayload } from "jsonwebtoken";
import type { NextFunction, Request, Response } from "express";
import config from "../config";
import { pool } from "../db";
import type { ROLES } from "../types";
import sendResponse from "../utils/sendResponse";

const auth =
  (...roles: ROLES[]) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const token = req.headers.authorization;

      // token check
      if (!token) {
        sendResponse(res, {
          statusCode: 401,
          success: false,
          message: "Unauthorized access!!",
        });
        return;
      }

      // verify token
      const decoded = jwt.verify(token, config.jwt_secret) as JwtPayload;

      // check user exists
      const userData = await pool.query(
        `SELECT
          id,
          email,
          role
          FROM users
          WHERE email = $1
          `,
        [decoded.email],
      );

      const user = userData.rows[0];

      if (userData.rows.length === 0) {
        sendResponse(res, {
          statusCode: 404,
          success: false,
          message: "User not found!",
        });

        return;
      }

      // role check
      if (roles.length && !roles.includes(user.role)) {
        sendResponse(res, {
          statusCode: 403,
          success: false,
          message: "Unauthorized access!!",
        });

        return;
      }

      req.user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
      };

      next();
    } catch (error) {
      next(error);
    }
  };

export default auth;
