import express from "express";

import authentication from "./authentication";
import users from "./users";
import list from "./list";

const router = express.Router();

export default (): express.Router => {
  authentication(router);
  users(router);
  list(router);

  return router;
};
