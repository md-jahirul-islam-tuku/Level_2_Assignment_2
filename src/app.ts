import cors from "cors";
import express, {
  type Application,
  type Request,
  type Response,
} from "express";
import globalErrorHandler from "./middleware/globalErrorHandler";
import { authRoute } from "./modules/auth/auth.route";
const app: Application = express();

app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:3000",
  }),
);

app.get("/", (req: Request, res: Response) => {
  res.send("Level_2_Assignment_2");
});

app.use("/api/auth", authRoute);

app.use(globalErrorHandler);
export default app;
