import bcrypt from "bcryptjs";
import { pool } from "../../db";
import type { IUser } from "../../types";

const signUpUser = async (user: IUser) => {
  const { name, email, password, role } = user;
  const hashedPassword = await bcrypt.hash(password, 10);

  const result = await pool.query(
    `
     INSERT INTO users(name,email,password,role) VALUES($1,$2,$3,COALESCE($4,'contributor')) RETURNING *
    `,
    [name, email, hashedPassword, role],
  );

  delete result.rows[0].password;

  return result;
};

export const authService = {
  signUpUser,
};
