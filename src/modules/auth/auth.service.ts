import bcrypt from "bcryptjs";
import { pool } from "../../db";
import type { IUser, TJwtUser } from "../../types";
import jwt, { type JwtPayload } from "jsonwebtoken";
import config from "../../config";

const signUpUser = async (user: IUser) => {
  const { name, email, password, role } = user;
  const hashedPassword = await bcrypt.hash(password, 10);

  // duplicate email check
  const existingUser = await pool.query(
    `
    SELECT *
    FROM users
    WHERE email = $1
    `,
    [email],
  );

  if (existingUser.rows.length) {
    throw new Error("User already exists");
  }

  const result = await pool.query(
    `
    INSERT INTO users (
      name,
      email,
      password,
      role
    )
    VALUES (
      $1,
      $2,
      $3,
      COALESCE(
        $4,
        'contributor'
      )
    )
    RETURNING
      id,
      name,
      email,
      role,
      created_at,
      updated_at
    `,
    [name, email, hashedPassword, role],
  );

  return result;
};

const logInUser = async (payload: { email: string; password: string }) => {
  const { email, password } = payload;

  const userData = await pool.query(
    `
    SELECT * FROM users WHERE email=$1
    `,
    [email],
  );
  if (userData.rows.length === 0) {
    throw new Error("User not found");
  }

  const user = userData.rows[0];
  const { id, name, role, created_at, updated_at } = user;
  const matchedPassword = await bcrypt.compare(password, user.password);

  if (!matchedPassword) {
    throw new Error("Invalid password!");
  }

  // generate jwt token
  const jwtPayload = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };

  const token = jwt.sign(jwtPayload, config.jwt_secret as string, {
    expiresIn: "1d",
  });

  const refreshToken = jwt.sign(jwtPayload, config.refresh_secret as string, {
    expiresIn: "10d",
  });

  return {
    token,
    refreshToken,
    user: { id, name, email, role, created_at, updated_at },
  };
};

const generateRefreshToken = async (token: string) => {
  if (!token) {
    throw new Error("Unauthorized");
  }

  const decoded = jwt.verify(
    token as string,
    config.refresh_secret as string,
  ) as TJwtUser; // use custom type because in default JwtPayload id, role not guaranteed

  const userData = await pool.query(
    `
     SELECT * FROM users WHERE email=$1   
        `,
    [decoded.email],
  );

  const user = userData.rows[0];

  if (userData.rows.length === 0) {
    throw new Error("User not found!!");
  }

  const jwtPayload: TJwtUser = { // use custom type because in default JwtPayload id, role not guaranteed
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };

  const accessToken = jwt.sign(jwtPayload, config.jwt_secret as string, {
    expiresIn: "1d",
  });

  return { accessToken };
};

export const authService = {
  signUpUser,
  logInUser,
  generateRefreshToken,
};
