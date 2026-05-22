import jwt from "jsonwebtoken";
import type {
  NextFunction,
  Request,
  Response,
} from "express";
import config from "../config";
import { pool } from "../db";
import type {
  ROLES,
  TJwtUser,
} from "../types";

const auth =
  (...roles: ROLES[]) =>
  async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const token =
        req.headers.authorization;

      // TOKEN CHECK
      if (!token) {
        res.status(401).json({
          success: false,
          message:
            "Unauthorized access!!",
        });

        return;
      }

      // VERIFY TOKEN
      const decoded =
        jwt.verify(
          token,
          config.jwt_secret as string
        ) as TJwtUser;

      // CHECK USER EXISTS
      const userData =
        await pool.query(
          `
          SELECT *
          FROM users
          WHERE email = $1
          `,
          [decoded.email]
        );

      const user =
        userData.rows[0];

      if (
        userData.rows.length === 0
      ) {
        res.status(404).json({
          success: false,
          message:
            "User not found!",
        });

        return;
      }

      // ROLE CHECK
      if (
        roles.length &&
        !roles.includes(
          user.role
        )
      ) {
        res.status(403).json({
          success: false,
          message:
            "Unauthorized access!!",
        });

        return;
      }

      req.user = {
        id: decoded.id,
        email:
          decoded.email,
        role:
          decoded.role,
      };

      next();
    } catch (error) {
      next(error);
    }
  };

export default auth;