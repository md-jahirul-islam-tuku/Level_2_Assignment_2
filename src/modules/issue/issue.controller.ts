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
  } catch (error) {
    const err = error as Error;
    sendResponse(res, {
      statusCode: 500,
      success: false,
      message: err.message,
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
  } catch (error) {
    const err = error as Error;
    sendResponse(res, {
      statusCode: 500,
      success: false,
      message: err.message,
      error: error,
    });
  }
};

const getSingleIssue = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);

    // INVALID ID
    if (isNaN(id)) {
      sendResponse(res, {
        statusCode: 400,
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
  } catch (error) {
    const err = error as Error;
    sendResponse(res, {
      statusCode: 500,
      success: false,
      message: err.message,
      error: error,
    });
  }
};

const updateIssue = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const issueId = Number(req.params.id);

    const user = req.user;

    if (!user) {
      sendResponse(res, {
        statusCode: 401,
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
    sendResponse(res, {
      statusCode: 200,
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

    sendResponse(res, {
      statusCode: statusCode,
      success: false,
      message: err.message,
      error: error,
    });
  }
};

const updateIssueStatus = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const issueId = Number(req.params.id);

    const { status } = req.body;

    const allowedStatus = ["open", "in_progress", "resolved"];

    if (!allowedStatus.includes(status)) {
      sendResponse(res, {
        statusCode: 400,
        success: false,
        message: "Invalid status value",
      });

      return;
    }

    const result = await issueService.updateIssueStatusIntoDB(issueId, status);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Issue status updated successfully",
      data: result,
    });
  } catch (error) {
    const err = error as Error;
    sendResponse(res, {
      statusCode: 500,
      success: false,
      message: err.message,
      error: error,
    });
  }
};

export const issueController = {
  createIssue,
  getAllIssues,
  getSingleIssue,
  updateIssue,
  updateIssueStatus,
};
