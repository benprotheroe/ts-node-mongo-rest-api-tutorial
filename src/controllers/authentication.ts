import express from "express";

import { getUserByEmail, createUser, getUserBySessionToken } from "../db/users";
import { authentication, random } from "../helpers";

export const login = async (req: express.Request, res: express.Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.sendStatus(400);
    }

    const user = await getUserByEmail(email).select(
      "+authentication.salt +authentication.password"
    );

    if (!user) {
      return res.status(400).json({ success: false });
    }

    const expectedHash = authentication(user.authentication.salt, password);

    if (user.authentication.password != expectedHash) {
      return res.status(403).json({ success: false });
    }

    const salt = random();
    user.authentication.sessionToken = authentication(
      salt,
      user._id.toString()
    );

    await user.save();

    res.cookie("ANTONIO-AUTH", user.authentication.sessionToken, {
      domain: "30-different-mr0099930-benprotheroe.vercel.app",
      path: "/",
      httpOnly: true,
    });
    return res.status(200).json({ success: true, user }).end();
  } catch (error) {
    console.log(error);
    return res.sendStatus(400);
  }
};

export const logout = async (req: express.Request, res: express.Response) => {
  try {
    const sessionToken = req.cookies["ANTONIO-AUTH"];
    if (!sessionToken) {
      return res.sendStatus(403);
    }

    const user = await getUserBySessionToken(sessionToken);
    if (!user) {
      return res.sendStatus(403);
    }

    user.authentication.sessionToken = null;
    await user.save();
    res.clearCookie("ANTONIO-AUTH", {
      domain: "30-different-mr0099930-benprotheroe.vercel.app",
      path: "/",
    });
    return res.sendStatus(200);
  } catch (error) {
    console.log(error);
    return res.sendStatus(400);
  }
};

export const register = async (req: express.Request, res: express.Response) => {
  try {
    const { email, password, username } = req.body;

    if (!email || !password || !username) {
      return res.sendStatus(400);
    }

    const existingUser = await getUserByEmail(email);

    if (existingUser) {
      return res.sendStatus(400);
    }

    const salt = random();
    const user = await createUser({
      email,
      username,
      authentication: {
        salt,
        password: authentication(salt, password),
      },
    });

    return res.status(200).json({ success: true, user }).end();
  } catch (error) {
    console.log(error);
    return res.sendStatus(400);
  }
};
