import app from "./app";
import config from "./config";
import { initDB } from "./db";

const main = async () => {
  try {
    await initDB();

    app.listen(config.port, () => {
      console.log(`Server app listening on port: ${config.port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);

    process.exit(1);
  }
};

main();
