import CookieParser from "cookie-parser";
import cors from "cors";
import express, {
  type Application,
  type Request,
  type Response,
} from "express";
import globalErrorHandler from "./middleware/globalErrorHandler";
import { authRoute } from "./modules/auth/auth.route";
import { issueRoutes } from "./modules/issue/issue.route";
const app: Application = express();

app.use(CookieParser());
app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:5000",
  }),
);

app.get("/", (req: Request, res: Response) => {
  res.send("Level_2_Assignment_2");
});

app.use("/api/auth", authRoute);
app.use("/api/issues", issueRoutes);

app.use(globalErrorHandler);
export default app;
