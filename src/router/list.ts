import express from "express";

import { addItem, getItemsByUser } from "../controllers/list";
import { isAuthenticated, isOwner } from "../middlewares";

export default (router: express.Router) => {
  router.post("/api/list/add-item", isAuthenticated, addItem);
  router.get("/api/list/get-list", isAuthenticated, getItemsByUser);
};
