import cors from "cors";
import express from "express";
import { errorHandler } from "./middleware/errorHandler.js";
import { authRouter } from "./routes/auth.js";
import { documentsRouter } from "./routes/documents.js";

export function createApp() {
  const app = express();

  const frontendOrigin = process.env.FRONTEND_ORIGIN?.trim();
  app.use(
    frontendOrigin
      ? cors({ origin: frontendOrigin })
      : cors(),
  );
  app.use(express.json({ limit: "1mb" }));

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/auth", authRouter);
  app.use("/documents", documentsRouter);

  app.use(errorHandler);

  return app;
}
