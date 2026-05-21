import type { Request } from "express";

export const USER_ROLE = {
  contributor: "contributor",
  maintainer: "maintainer",
} as const;

export type ROLES = "contributor" | "maintainer";

export interface IUser {
  name: string;
  email: string;
  password: string;
  role?: string;
}

export interface JwtPayload {
  id: number;
  email: string;
  role: "contributor" | "maintainer";
}

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

export type QueryParams = {
  sort?: string;
  type?: string;
  status?: string;
};
