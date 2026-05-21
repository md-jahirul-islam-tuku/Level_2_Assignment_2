import express from "express";
import auth from "../../middleware/auth";
import { USER_ROLE } from "../../types";
import { issueController } from "./issue.controller";

const router = express.Router();

router.post(
  "/",
  auth(USER_ROLE.contributor, USER_ROLE.maintainer),
  issueController.createIssue,
);

router.get(
  "/",
  auth(USER_ROLE.contributor, USER_ROLE.maintainer),
  issueController.getAllIssues,
);

export const issueRoutes = router;
