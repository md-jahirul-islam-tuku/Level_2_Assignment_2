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

    res.status(200).json({
      success: true,
      data: result,
    });
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

export const issueController = {
  createIssue,
  getAllIssues,
};
