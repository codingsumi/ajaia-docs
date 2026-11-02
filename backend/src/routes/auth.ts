import { Router } from "express";
import { prisma } from "../db.js";
import { badRequest, unauthorized } from "../lib/errors.js";
import { createToken } from "../lib/jwt.js";
import { verifyPassword } from "../lib/password.js";
import { publicUser } from "../lib/serialize.js";
import { requireAuth } from "../middleware/auth.js";

export const authRouter = Router();

authRouter.post("/login", async (req, res, next) => {
  try {
    const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const password = typeof req.body?.password === "string" ? req.body.password : "";

    if (!email || !password) {
      throw badRequest("email and password are required");
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await verifyPassword(password, user.password))) {
      throw unauthorized("Invalid email or password");
    }

    const token = createToken({ id: user.id, email: user.email });
    res.json({
      token,
      user: publicUser(user),
    });
  } catch (error) {
    next(error);
  }
});

authRouter.get("/me", requireAuth, async (req, res, next) => {
  try {
    res.json({ user: req.user });
  } catch (error) {
    next(error);
  }
});
