import type { JwtPayload } from "jsonwebtoken";
import { pool } from "../../db";
import type { IssueStatus, QueryParams, Reporter, UpdateIssuePayload } from "../../types";

const createIssueIntoDB = async (
  payload: {
    title: string;
    description: string;
    type: "bug" | "feature_request";
  },
  reporterId: number,
) => {
  // title, description length validation
  const { title, description, type } = payload;
  if (title.length > 150) {
    throw new Error("Title cannot exceed 150 characters");
  }
  if (description.length < 20) {
    throw new Error("Description must be at least 20 characters");
  }

  const query = `
    INSERT INTO issues (
      title,
      description,
      type,
      reporter_id
    )
    VALUES ($1, $2, $3, $4)
    RETURNING
    id,
    title,
    description,
    type,
    status,
    reporter_id,
    created_at,
    updated_at
  `;

  const values = [title, description, type, reporterId];

  const result = await pool.query(query, values);

  return result.rows[0];
};

const getAllIssuesFromDB = async (queryParams: QueryParams) => {
  const { sort = "newest", type, status } = queryParams;

  const conditions: string[] = [];
  const values: string[] = [];

  //* filter: type
  if (type) {
    values.push(type);
    conditions.push(`type = $${values.length}`);
  }

  //* filter: status
  if (status) {
    values.push(status);
    conditions.push(`status = $${values.length}`);
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  //* sort
  const orderBy =
    sort === "oldest" ? "ORDER BY created_at ASC" : "ORDER BY created_at DESC";

  //* query param validation
  const validTypes = ["bug", "feature_request"];
  const validStatus = ["open", "in_progress", "resolved"];
  if (type && !validTypes.includes(type)) {
    throw new Error("Invalid issue type");
  }
  if (status && !validStatus.includes(status)) {
    throw new Error("Invalid issue status");
  }

  const issuesQuery = `
    SELECT *
    FROM issues
    ${whereClause}
    ${orderBy}
  `;

  const issuesResult = await pool.query(issuesQuery, values);

  const issues = issuesResult.rows;

  /*
   * get newest issues: /api/issues
   * oldest first: /api/issues?sort=oldest
   * only bugs: /api/issues?type=bug
   * only resolved: /api/issues?status=resolved
   * combined filter: /api/issues?type=bug&status=open&sort=newest
   */

  if (!issues.length) {
    return [];
  }

  const reporterIds = [...new Set(issues.map((issue) => issue.reporter_id))];

  //* get reporters without join
  const reportersQuery = `
    SELECT id, name, role
    FROM users
    WHERE id = ANY($1)
  `;

  const reportersResult = await pool.query(reportersQuery, [reporterIds]);

  const reporterMap = reportersResult.rows.reduce(
    (acc, reporter) => {
      acc[reporter.id] = reporter;

      return acc;
    },
    {} as Record<number, Reporter>,
  );

  const formattedIssues = issues.map((issue) => ({
    id: issue.id,
    title: issue.title,
    description: issue.description,
    type: issue.type,
    status: issue.status,
    reporter: reporterMap[issue.reporter_id] || null,
    created_at: issue.created_at,
    updated_at: issue.updated_at,
  }));

  return formattedIssues;
};

const getSingleIssueFromDB = async (id: number) => {
  const issueQuery = `
    SELECT *
    FROM issues
    WHERE id = $1
  `;

  const issueResult = await pool.query(issueQuery, [id]);

  const issue = issueResult.rows[0];

  if (!issue) {
    return null;
  }

  //* get reporter
  const reporterQuery = `
    SELECT id, name, role
    FROM users
    WHERE id = $1
  `;

  const reporterResult = await pool.query(reporterQuery, [issue.reporter_id]);

  const reporter = reporterResult.rows[0] || null;

  //* format response
  return {
    id: issue.id,
    title: issue.title,
    description: issue.description,
    type: issue.type,
    status: issue.status,
    reporter,
    created_at: issue.created_at,
    updated_at: issue.updated_at,
  };
};

const updateIssueIntoDB = async (
  issueId: number,
  payload: UpdateIssuePayload,
  user: JwtPayload,
) => {
  // check issue exists
  const issueResult = await pool.query(
    `
      SELECT *
      FROM issues
      WHERE id = $1
      `,
    [issueId],
  );

  const existingIssue = issueResult.rows[0];

  if (!existingIssue) {
    throw new Error("Issue not found");
  }

  // authorization check
  const isMaintainer = user.role === "maintainer";

  const isOwner = existingIssue.reporter_id === user.id;

  const isOpen = existingIssue.status === "open";

  const canUpdate = isMaintainer || (isOwner && isOpen);

  if (!canUpdate) {
    throw new Error("You are not authorized to update this issue");
  }

  // keep old values if not provided
  const updatedTitle = payload.title ?? existingIssue.title;

  const updatedDescription = payload.description ?? existingIssue.description;

  const updatedType = payload.type ?? existingIssue.type;

  // update issue
  const updateQuery = `
    UPDATE issues
    SET
      title = $1,
      description = $2,
      type = $3,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $4
    RETURNING
    id,
    title,
    description,
    type,
    status,
    reporter_id,
    created_at,
    updated_at
  `;

  const values = [updatedTitle, updatedDescription, updatedType, issueId];

  const result = await pool.query(updateQuery, values);

  return result.rows[0];
};

const updateIssueStatusIntoDB = async (
  issueId: number,
  status: IssueStatus
) => {
  const issueResult = await pool.query(
    `
        SELECT *
        FROM issues
        WHERE id = $1
        `,
    [issueId],
  );

  const existingIssue = issueResult.rows[0];

  if (!existingIssue) {
    throw new Error("Issue not found");
  }

  const query = `
      UPDATE issues
      SET
        status = $1,
        updated_at =
          CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING
        id,
        title,
        description,
        type,
        status,
        reporter_id,
        created_at,
        updated_at
        `;

  const result = await pool.query(query, [status, issueId]);

  return result.rows[0];
};

const deleteIssueFromDB = async (issueId: number) => {
  const query = `
      DELETE FROM issues
      WHERE id = $1
      RETURNING id
    `;

  const result = await pool.query(query, [issueId]);

  const deletedIssue = result.rows[0];

  if (!deletedIssue) {
    throw new Error("Issue not found");
  }

  return deletedIssue;
};

export const issueService = {
  createIssueIntoDB,
  getAllIssuesFromDB,
  getSingleIssueFromDB,
  updateIssueIntoDB,
  updateIssueStatusIntoDB,
  deleteIssueFromDB,
};
