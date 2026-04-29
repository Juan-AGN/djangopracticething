import express, { NextFunction, Request, Response } from "express";
import http from "http";

import cors from "cors";

const app = express();
const port = 9998;

app.use(cors());

const server = http.createServer(app);

app.use("/api/img/", express.static("img"));

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});