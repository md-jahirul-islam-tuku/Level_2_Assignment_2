import express, {
  type Application,
  type Request,
  type Response,
} from "express";
import config from "./config";
const app: Application = express();

app.get("/", (req: Request, res: Response) => {
  res.send("Level_2_Assignment_2");
});

app.listen(config.port, () => {
  console.log(`Server app listening on port: ${config.port}`);
});
