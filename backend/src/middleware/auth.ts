import type { NextFunction, Request, Response } from "express";
import { prisma } from "../db.js";
import { unauthorized } from "../lib/errors.js";
import { verifyToken } from "../lib/jwt.js";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
};

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      throw unauthorized("Missing or invalid Authorization header");
    }

    const token = header.slice("Bearer ".length).trim();
    if (!token) {
      throw unauthorized("Missing or invalid Authorization header");
    }

    const payload = verifyToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, name: true, email: true },
    });

    if (!user) {
      throw unauthorized("User no longer exists");
    }

    req.user = user;
    next();
  } catch (error) {
    if (error && typeof error === "object" && "status" in error) {
      next(error);
      return;
    }
    next(unauthorized("Invalid or expired token"));
  }
}
