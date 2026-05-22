

   import { createRequire } from 'module';

   const require = createRequire(import.meta.url);

  

// src/app.ts
import cookieParser from "cookie-parser";
import cors from "cors";
import express2 from "express";

// src/config/index.ts
import dotenv from "dotenv";
dotenv.config();
var config = {
  connection_string: process.env.CONNECTION_STRING,
  port: Number(process.env.PORT) || 5e3,
  jwt_secret: process.env.JWT_SECRET,
  refresh_secret: process.env.REFRESH_SECRET,
  node_env: process.env.NODE_ENV || "development"
};
var config_default = config;

// src/middleware/globalErrorHandler.ts
var globalErrorHandler = (err, req, res, next) => {
  let statusCode = 500;
  let message = "Internal Server Error";
  if (err instanceof Error) {
    message = err.message;
    if (err.message === "User not found") {
      statusCode = 404;
    } else if (err.message === "Issue not found") {
      statusCode = 404;
    } else if (err.message === "Invalid password!") {
      statusCode = 401;
    } else if (err.message.includes("Unauthorized")) {
      statusCode = 401;
    }
  }
  if (typeof err === "object" && err !== null && "code" in err && err.code === "23505") {
    statusCode = 409;
    message = "Email already exists";
  }
  res.status(statusCode).json({
    success: false,
    message,
    stack: config_default.node_env === "development" && err instanceof Error ? err.stack : void 0
  });
};
var globalErrorHandler_default = globalErrorHandler;

// src/modules/auth/auth.route.ts
import { Router } from "express";

// src/modules/auth/auth.service.ts
import bcrypt from "bcryptjs";

// src/db/index.ts
import { Pool } from "pg";
var pool = new Pool({
  connectionString: config_default.connection_string
});
var initDB = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role VARCHAR(20) DEFAULT 'contributor' CHECK (role IN ('contributor', 'maintainer')),

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
    `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS issues (
    id SERIAL PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    description TEXT NOT NULL CHECK (char_length(description) >= 20),
    type VARCHAR(20) NOT NULL CHECK (type IN ('bug', 'feature_request')),
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved')),
    reporter_id INT NOT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )  
    `);
  console.log("Database connected successfully!");
};

// src/modules/auth/auth.service.ts
import jwt from "jsonwebtoken";
var signUpUser = async (user) => {
  const { name, email, password, role } = user;
  const hashedPassword = await bcrypt.hash(password, 10);
  const existingUser = await pool.query(
    `
    SELECT *
    FROM users
    WHERE email = $1
    `,
    [email]
  );
  if (existingUser.rows.length) {
    throw new Error("User already exists");
  }
  const result = await pool.query(
    `
    INSERT INTO users (
      name,
      email,
      password,
      role
    )
    VALUES (
      $1,
      $2,
      $3,
      COALESCE(
        $4,
        'contributor'
      )
    )
    RETURNING
      id,
      name,
      email,
      role,
      created_at,
      updated_at
    `,
    [name, email, hashedPassword, role]
  );
  return result;
};
var logInUser = async (payload) => {
  const { email, password } = payload;
  const userData = await pool.query(
    `
    SELECT * FROM users WHERE email=$1
    `,
    [email]
  );
  if (userData.rows.length === 0) {
    throw new Error("User not found");
  }
  const user = userData.rows[0];
  const { id, name, role, created_at, updated_at } = user;
  const matchedPassword = await bcrypt.compare(password, user.password);
  if (!matchedPassword) {
    throw new Error("Invalid password!");
  }
  const jwtPayload = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role
  };
  const token = jwt.sign(jwtPayload, config_default.jwt_secret, {
    expiresIn: "1d"
  });
  const refreshToken2 = jwt.sign(jwtPayload, config_default.refresh_secret, {
    expiresIn: "10d"
  });
  return {
    token,
    refreshToken: refreshToken2,
    user: { id, name, email, role, created_at, updated_at }
  };
};
var generateRefreshToken = async (token) => {
  if (!token) {
    throw new Error("Unauthorized");
  }
  const decoded = jwt.verify(
    token,
    config_default.refresh_secret
  );
  const userData = await pool.query(
    `
     SELECT * FROM users WHERE email=$1   
        `,
    [decoded.email]
  );
  const user = userData.rows[0];
  if (userData.rows.length === 0) {
    throw new Error("User not found!!");
  }
  const jwtPayload = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role
  };
  const accessToken = jwt.sign(jwtPayload, config_default.jwt_secret, {
    expiresIn: "1d"
  });
  return { accessToken };
};
var authService = {
  signUpUser,
  logInUser,
  generateRefreshToken
};

// src/utils/sendResponse.ts
var sendResponse = (res, data) => {
  res.status(data.statusCode).json({
    success: data.success,
    message: data.message,
    data: data.data,
    error: data.error
  });
};
var sendResponse_default = sendResponse;

// src/modules/auth/auth.controller.ts
var signup = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    const user = await authService.signUpUser({ name, email, password, role });
    if (!user) {
      return sendResponse_default(res, {
        statusCode: 400,
        success: false,
        message: "Failed to register user !!"
      });
    }
    sendResponse_default(res, {
      statusCode: 201,
      success: true,
      message: "User registered successfully",
      data: user.rows[0]
    });
  } catch (error) {
    next(error);
  }
};
var login = async (req, res, next) => {
  try {
    const result = await authService.logInUser(req.body);
    const { token, refreshToken: refreshToken2, user } = result;
    res.cookie("refreshToken", refreshToken2, {
      secure: config_default.node_env === "production",
      httpOnly: true,
      sameSite: "lax"
    });
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Login successful",
      data: { token, user }
    });
  } catch (error) {
    next(error);
  }
};
var refreshToken = async (req, res, next) => {
  try {
    const result = await authService.generateRefreshToken(
      req.cookies.refreshToken
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Access token generated!",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var authController = {
  signup,
  login,
  refreshToken
};

// src/modules/auth/auth.route.ts
var router = Router();
router.post("/signup", authController.signup);
router.post("/login", authController.login);
router.post("/refresh-token", authController.refreshToken);
var authRoute = router;

// src/modules/issue/issue.route.ts
import express from "express";

// src/middleware/auth.ts
import jwt2 from "jsonwebtoken";
var auth = (...roles) => async (req, res, next) => {
  try {
    const token = req.headers.authorization;
    if (!token) {
      sendResponse_default(res, {
        statusCode: 401,
        success: false,
        message: "Unauthorized access!!"
      });
      return;
    }
    const decoded = jwt2.verify(token, config_default.jwt_secret);
    const userData = await pool.query(
      `SELECT
          id,
          email,
          role
          FROM users
          WHERE email = $1
          `,
      [decoded.email]
    );
    const user = userData.rows[0];
    if (userData.rows.length === 0) {
      sendResponse_default(res, {
        statusCode: 404,
        success: false,
        message: "User not found!"
      });
      return;
    }
    if (roles.length && !roles.includes(user.role)) {
      sendResponse_default(res, {
        statusCode: 403,
        success: false,
        message: "Unauthorized access!!"
      });
      return;
    }
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role
    };
    next();
  } catch (error) {
    next(error);
  }
};
var auth_default = auth;

// src/types/index.ts
var USER_ROLE = {
  contributor: "contributor",
  maintainer: "maintainer"
};

// src/modules/issue/issue.service.ts
var createIssueIntoDB = async (payload, reporterId) => {
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
var getAllIssuesFromDB = async (queryParams) => {
  const { sort = "newest", type, status } = queryParams;
  const conditions = [];
  const values = [];
  if (type) {
    values.push(type);
    conditions.push(`type = $${values.length}`);
  }
  if (status) {
    values.push(status);
    conditions.push(`status = $${values.length}`);
  }
  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const orderBy = sort === "oldest" ? "ORDER BY created_at ASC" : "ORDER BY created_at DESC";
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
  if (!issues.length) {
    return [];
  }
  const reporterIds = [...new Set(issues.map((issue) => issue.reporter_id))];
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
    {}
  );
  const formattedIssues = issues.map((issue) => ({
    id: issue.id,
    title: issue.title,
    description: issue.description,
    type: issue.type,
    status: issue.status,
    reporter: reporterMap[issue.reporter_id] || null,
    created_at: issue.created_at,
    updated_at: issue.updated_at
  }));
  return formattedIssues;
};
var getSingleIssueFromDB = async (id) => {
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
  const reporterQuery = `
    SELECT id, name, role
    FROM users
    WHERE id = $1
  `;
  const reporterResult = await pool.query(reporterQuery, [issue.reporter_id]);
  const reporter = reporterResult.rows[0] || null;
  return {
    id: issue.id,
    title: issue.title,
    description: issue.description,
    type: issue.type,
    status: issue.status,
    reporter,
    created_at: issue.created_at,
    updated_at: issue.updated_at
  };
};
var updateIssueIntoDB = async (issueId, payload, user) => {
  const issueResult = await pool.query(
    `
      SELECT *
      FROM issues
      WHERE id = $1
      `,
    [issueId]
  );
  const existingIssue = issueResult.rows[0];
  if (!existingIssue) {
    throw new Error("Issue not found");
  }
  const isMaintainer = user.role === "maintainer";
  const isOwner = existingIssue.reporter_id === user.id;
  const isOpen = existingIssue.status === "open";
  const canUpdate = isMaintainer || isOwner && isOpen;
  if (!canUpdate) {
    throw new Error("You are not authorized to update this issue");
  }
  const updatedTitle = payload.title ?? existingIssue.title;
  const updatedDescription = payload.description ?? existingIssue.description;
  const updatedType = payload.type ?? existingIssue.type;
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
var updateIssueStatusIntoDB = async (issueId, status) => {
  const issueResult = await pool.query(
    `
        SELECT *
        FROM issues
        WHERE id = $1
        `,
    [issueId]
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
var deleteIssueFromDB = async (issueId) => {
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
var issueService = {
  createIssueIntoDB,
  getAllIssuesFromDB,
  getSingleIssueFromDB,
  updateIssueIntoDB,
  updateIssueStatusIntoDB,
  deleteIssueFromDB
};

// src/modules/issue/issue.controller.ts
var createIssue = async (req, res, next) => {
  try {
    const reporterId = req.user?.id;
    if (!reporterId) {
      return sendResponse_default(res, {
        statusCode: 401,
        success: false,
        message: "Unauthorized access"
      });
    }
    const result = await issueService.createIssueIntoDB(req.body, reporterId);
    sendResponse_default(res, {
      statusCode: 201,
      success: true,
      message: "Issue created successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var getAllIssues = async (req, res, next) => {
  try {
    const result = await issueService.getAllIssuesFromDB(req.query);
    if (!result.length) {
      sendResponse_default(res, {
        statusCode: 200,
        success: true,
        message: "No issues found",
        data: []
      });
      return;
    }
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var getSingleIssue = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      sendResponse_default(res, {
        statusCode: 400,
        success: false,
        message: "Invalid issue ID"
      });
      return;
    }
    const result = await issueService.getSingleIssueFromDB(id);
    if (!result) {
      sendResponse_default(res, {
        statusCode: 404,
        success: false,
        message: "Issue not found"
      });
      return;
    }
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var updateIssue = async (req, res, next) => {
  try {
    const issueId = Number(req.params.id);
    if (isNaN(issueId)) {
      return sendResponse_default(res, {
        statusCode: 400,
        success: false,
        message: "Invalid issue ID"
      });
    }
    const user = req.user;
    if (!user) {
      sendResponse_default(res, {
        statusCode: 401,
        success: false,
        message: "Unauthorized access"
      });
      return;
    }
    const result = await issueService.updateIssueIntoDB(
      issueId,
      req.body,
      user
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Issue updated successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var updateIssueStatus = async (req, res, next) => {
  try {
    const issueId = Number(req.params.id);
    if (isNaN(issueId)) {
      return sendResponse_default(res, {
        statusCode: 400,
        success: false,
        message: "Invalid issue ID"
      });
    }
    const { status } = req.body;
    const allowedStatus = ["open", "in_progress", "resolved"];
    if (!allowedStatus.includes(status)) {
      sendResponse_default(res, {
        statusCode: 400,
        success: false,
        message: "Invalid status value"
      });
      return;
    }
    const result = await issueService.updateIssueStatusIntoDB(issueId, status);
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Issue status updated successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var deleteIssue = async (req, res, next) => {
  try {
    const issueId = Number(req.params.id);
    if (isNaN(issueId)) {
      return sendResponse_default(res, {
        statusCode: 400,
        success: false,
        message: "Invalid issue ID"
      });
    }
    await issueService.deleteIssueFromDB(issueId);
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Issue deleted successfully"
    });
  } catch (error) {
    next(error);
  }
};
var issueController = {
  createIssue,
  getAllIssues,
  getSingleIssue,
  updateIssue,
  updateIssueStatus,
  deleteIssue
};

// src/modules/issue/issue.route.ts
var router2 = express.Router();
router2.post(
  "/",
  auth_default(USER_ROLE.contributor, USER_ROLE.maintainer),
  issueController.createIssue
);
router2.get("/", issueController.getAllIssues);
router2.get("/:id", issueController.getSingleIssue);
router2.patch(
  "/:id",
  auth_default(USER_ROLE.contributor, USER_ROLE.maintainer),
  issueController.updateIssue
);
router2.patch(
  "/:id/status",
  auth_default(USER_ROLE.maintainer),
  issueController.updateIssueStatus
);
router2.delete("/:id", auth_default(USER_ROLE.maintainer), issueController.deleteIssue);
var issueRoutes = router2;

// src/app.ts
var app = express2();
app.use(express2.json());
app.use(cookieParser());
app.use(
  cors({
    origin: true,
    // request origin automatically allow
    credentials: true
  })
);
app.get("/", (_, res) => {
  res.send("Level_2_Assignment_2");
});
app.use("/api/auth", authRoute);
app.use("/api/issues", issueRoutes);
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found"
  });
});
app.use(globalErrorHandler_default);
var app_default = app;

// src/server.ts
var main = async () => {
  try {
    await initDB();
    app_default.listen(config_default.port, () => {
      console.log(`Server app listening on port: ${config_default.port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};
main();
//# sourceMappingURL=server.js.map