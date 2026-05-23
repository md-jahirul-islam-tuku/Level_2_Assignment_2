export const USER_ROLE = {
  contributor: "contributor",
  maintainer: "maintainer",
} as const;

export type ROLES = (typeof USER_ROLE)[keyof typeof USER_ROLE];

export type IssueType = "bug" | "feature_request";

export const ISSUE_STATUS = ["open", "in_progress", "resolved"] as const;

export type IssueStatus = (typeof ISSUE_STATUS)[number];

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

export type Reporter = {
  id: number;
  name: string;
  role: ROLES;
};
