import express from "express";
import http from "http";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import compression from "compression";
import cors from "cors";

import router from "./router";
import mongoose from "mongoose";

const app = express();

app.use(
  cors({
    credentials: true,
  })
);

app.use(compression());
app.use(cookieParser());
app.use(bodyParser.json());

const server = http.createServer(app);

server.listen(8081, () => {
  console.log("Server running on http://localhost:8081/");
});

const MONGO_URL =
  "mongodb+srv://benprotheroe:wmkAwyqljqgQyYsg@cluster0.xbagcn4.mongodb.net/?retryWrites=true&w=majority"; // DB URI

mongoose.Promise = Promise;
mongoose.connect(MONGO_URL);
mongoose.connection.on("error", (error: Error) => console.log(error));

app.get("/", (req, res) => res.status(200).json({ message: "hello world" }));
app.use("/", router());

export default app;
