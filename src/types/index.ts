export const USER_ROLE = {
  contributor: "contributor",
  maintainer: "maintainer",
} as const;

export type ROLES = (typeof USER_ROLE)[keyof typeof USER_ROLE];

export type IssueType = "bug" | "feature_request";

export type IssueStatus = "open" | "in_progress" | "resolved";

export interface IUser {
  name: string;
  email: string;
  password: string;
  role?: ROLES;
}

export type TJwtUser = {
  id: number;
  name: string;
  email: string;
  role: ROLES;
};

export type QueryParams = {
  sort?: "newest" | "oldest";
  type?: IssueType;
  status?: IssueStatus;
};

export type UpdateIssuePayload = {
  title?: string;
  description?: string;
  type?: IssueType;
};
