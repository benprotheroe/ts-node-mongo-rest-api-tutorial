import { createItem, getListByUserId } from "../db/list";
import express from "express";
import { get } from "lodash";

export const addItem = async (req: express.Request, res: express.Response) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.sendStatus(400);
    }

    //   const existingUser = await getUserByEmail(email);

    //   if (existingUser) {
    //     return res.sendStatus(400);
    //   }

    //   const salt = random();

    const currentUserId = get(req, "identity._id") as string;
    const item = await createItem({
      name,
      user_id: currentUserId,
    });
    return res.status(200).json({ success: true, item }).end();
  } catch (error) {
    console.log(error);
    return res.sendStatus(400);
  }
};

export const getItemsByUser = async (
  req: express.Request,
  res: express.Response
) => {
  try {
    const currentUserId = get(req, "identity._id") as string;

    const items = await getListByUserId(currentUserId);

    return res.status(200).json(items);
  } catch (error) {
    console.log(error);
    return res.sendStatus(400);
  }
};
