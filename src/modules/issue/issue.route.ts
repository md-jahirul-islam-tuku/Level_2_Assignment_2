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

router.get("/", issueController.getAllIssues);

router.get("/:id", issueController.getSingleIssue);

router.patch(
  "/:id",
  auth(USER_ROLE.contributor, USER_ROLE.maintainer),
  issueController.updateIssue,
);

router.patch(
  "/:id/status",
  auth(USER_ROLE.maintainer),
  issueController.updateIssueStatus,
);

router.delete(
  "/:id",
  auth(
    USER_ROLE.maintainer
  ),
  issueController.deleteIssue
);

export const issueRoutes = router;
