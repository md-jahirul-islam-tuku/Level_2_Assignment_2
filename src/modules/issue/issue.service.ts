import { pool } from "../../db";

const createIssueIntoDB = async (
  payload: {
    title: string;
    description: string;
    type: "bug" | "feature_request";
  },
  reporterId: number,
) => {
  const { title, description, type } = payload;

  const query = `
    INSERT INTO issues (
      title,
      description,
      type,
      reporter_id
    )
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `;

  const values = [title, description, type, reporterId];

  const result = await pool.query(query, values);

  return result.rows[0];
};

export const issueService = {
  createIssueIntoDB,
};
