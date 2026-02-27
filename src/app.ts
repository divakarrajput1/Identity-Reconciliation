import express from "express";
import IdentifyRouter from "./routes/identify.route";

const app = express();

app.use(express.json());

app.use("/identify", IdentifyRouter);

// Global error handler
app.use((err: any, req: any, res: any, next: any) => {
  console.error(err);

  res.status(500).json({
    message: "Internal Server Error",
  });
});

export default app;