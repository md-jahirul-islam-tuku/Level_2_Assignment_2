import express, {
  type Application,
  type Request,
  type Response,
} from "express";
const app: Application = express();

app.get("/", (req: Request, res: Response) => {
  res.send("Level_2_Assignment_2");
});

export default app;
