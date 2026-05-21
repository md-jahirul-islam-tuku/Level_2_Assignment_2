import type { Request, Response } from "express";
import { issueService } from "./issue.service";
import type { AuthRequest } from "../../types";
import sendResponse from "../../utils/sendResponse";

const createIssue = async (req: AuthRequest, res: Response) => {
  try {
    const reporterId = req.user?.id;

    if (!reporterId) {
      sendResponse(res, {
        statusCode: 401,
        success: false,
        message: "Unauthorized access",
      });
      return;
    }

    const result = await issueService.createIssueIntoDB(req.body, reporterId);

    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: "Issue created successfully",
      data: result,
    });
  } catch (error: any) {
    sendResponse(res, {
      statusCode: 500,
      success: false,
      message: error.message,
      error: error,
    });
  }
};

const getAllIssues = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await issueService.getAllIssuesFromDB(req.query);
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "All issues retrieved successfully",
      data: result,
    });
  } catch (error: any) {
    sendResponse(res, {
      statusCode: 500,
      success: false,
      message: error.message,
      error: error,
    });
  }
};

const getSingleIssue = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);

    // INVALID ID
    if (isNaN(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid issue ID",
      });

      return;
    }

    const result = await issueService.getSingleIssueFromDB(id);

    // NOT FOUND
    if (!result) {
      sendResponse(res, {
        statusCode: 404,
        success: false,
        message: "Issue not found",
      });
      return;
    }

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Issue retrieved successfully",
      data: result,
    });
  } catch (error: any) {
    sendResponse(res, {
      statusCode: 500,
      success: false,
      message: error.message,
      error: error,
    });
  }
};

const updateIssue = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const issueId = Number(req.params.id);

    const user = req.user;

    if (!user) {
      res.status(401).json({
        success: false,
        message: "Unauthorized access",
      });

      return;
    }

    const result = await issueService.updateIssueIntoDB(
      issueId,
      req.body,
      user,
    );

    res.status(200).json({
      success: true,
      message: "Issue updated successfully",
      data: result,
    });
  } catch (error) {
    const err = error as Error;

    const statusCode =
      err.message === "Issue not found"
        ? 404
        : err.message.includes("authorized")
          ? 403
          : 500;

    res.status(statusCode).json({
      success: false,
      message: err.message,
    });
  }
};

export const issueController = {
  createIssue,
  getAllIssues,
  getSingleIssue,
  updateIssue,
};
