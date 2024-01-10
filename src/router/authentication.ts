import express from "express";

import { login, logout, register } from "../controllers/authentication";

export default (router: express.Router) => {
  router.post("/api/auth/register", register);
  router.post("/api/auth/login", login);
  router.get("/api/auth/logout", logout);
};
