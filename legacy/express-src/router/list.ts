import express from "express";

import { addItem, getItemsByUser } from "../controllers/list";
import { isAuthenticated, isOwner } from "../middlewares";

export default (router: express.Router) => {
  router.post("/list/add-item", isAuthenticated, addItem);
  router.get("/list/get-list", isAuthenticated, getItemsByUser);
};
