import type { Response } from "express";
import { issueService } from "./issue.service";
import type { AuthRequest } from "../../types";

const createIssue = async (req: AuthRequest, res: Response) => {
  try {
    const reporterId = req.user?.id;

    if (!reporterId) {
      res.status(401).json({
        success: false,
        message: "Unauthorized access",
      });
      return;
    }

    const result = await issueService.createIssueIntoDB(req.body, reporterId);

    res.status(201).json({
      success: true,
      message: "Issue created successfully",
      data: result,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

export const issueController = {
  createIssue,
};
