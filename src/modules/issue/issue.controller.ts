import type { NextFunction, Request, Response } from "express";
import { issueService } from "./issue.service";
import sendResponse from "../../utils/sendResponse";
import { ISSUE_STATUS } from "../../types";

const createIssue = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const reporterId = req.user?.id;

    if (!reporterId) {
      return sendResponse(res, {
        statusCode: 401,
        success: false,
        message: "Unauthorized access",
      });
    }

    const result = await issueService.createIssueIntoDB(req.body, reporterId);

    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: "Issue created successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getAllIssues = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const result = await issueService.getAllIssuesFromDB(req.query);

    if (!result.length) {
      sendResponse(res, {
        statusCode: 404,
        success: false,
        message: "Issues not found!",
        data: [],
      });

      return;
    }

    sendResponse(res, {
      statusCode: 200,
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getSingleIssue = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = Number(req.params.id);

    // invalid id
    if (isNaN(id)) {
      sendResponse(res, {
        statusCode: 400,
        success: false,
        message: "Invalid issue ID",
      });

      return;
    }

    const result = await issueService.getSingleIssueFromDB(id);

    // not found
    if (!result) {
      sendResponse(res, {
        statusCode: 404,
        success: false,
        message: "Issue not found",
        data: {},
      });
      return;
    }

    sendResponse(res, {
      statusCode: 200,
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const updateIssue = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const issueId = Number(req.params.id);

    if (isNaN(issueId)) {
      return sendResponse(res, {
        statusCode: 400,
        success: false,
        message: "Invalid issue ID",
      });
    }

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
    next(error);
  }
};

const updateIssueStatus = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const issueId = Number(req.params.id);

    if (isNaN(issueId)) {
      return sendResponse(res, {
        statusCode: 400,
        success: false,
        message: "Invalid issue ID",
      });
    }

    const { status } = req.body;

    if (!ISSUE_STATUS.includes(status)) {
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
    next(error);
  }
};

const deleteIssue = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const issueId = Number(req.params.id);

    if (isNaN(issueId)) {
      return sendResponse(res, {
        statusCode: 400,
        success: false,
        message: "Invalid issue ID",
      });
    }

    await issueService.deleteIssueFromDB(issueId);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Issue deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const issueController = {
  createIssue,
  getAllIssues,
  getSingleIssue,
  updateIssue,
  updateIssueStatus,
  deleteIssue,
};
