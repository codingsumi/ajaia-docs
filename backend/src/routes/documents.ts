import { Permission, Prisma } from "@prisma/client";
import { Router } from "express";
import { prisma } from "../db.js";
import { requireDocumentAccess } from "../lib/access.js";
import { badRequest, notFound } from "../lib/errors.js";
import { publicDocument, publicShare } from "../lib/serialize.js";
import { requireAuth } from "../middleware/auth.js";

export const documentsRouter = Router();

documentsRouter.use(requireAuth);

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

documentsRouter.post("/", async (req, res, next) => {
  try {
    const title =
      typeof req.body?.title === "string" && req.body.title.trim()
        ? req.body.title.trim()
        : "Untitled";
    const content = req.body?.content === undefined ? {} : req.body.content;

    if (!isPlainObject(content) && !Array.isArray(content)) {
      throw badRequest("content must be valid Tiptap JSON");
    }

    const document = await prisma.document.create({
      data: {
        title,
        content: content as Prisma.InputJsonValue,
        ownerId: req.user!.id,
      },
    });

    res.status(201).json({ document: publicDocument({ ...document, permission: "OWNER" }) });
  } catch (error) {
    next(error);
  }
});

documentsRouter.get("/", async (req, res, next) => {
  try {
    const documents = await prisma.document.findMany({
      where: { ownerId: req.user!.id },
      orderBy: { updatedAt: "desc" },
    });

    res.json({
      documents: documents.map((document: (typeof documents)[number]) =>
        publicDocument({ ...document, permission: "OWNER" }),
      ),
    });
  } catch (error) {
    next(error);
  }
});

documentsRouter.get("/shared", async (req, res, next) => {
  try {
    const shares = await prisma.documentShare.findMany({
      where: { userId: req.user!.id },
      include: {
        document: {
          include: {
            owner: { select: { id: true, name: true, email: true } },
          },
        },
      },
      orderBy: { document: { updatedAt: "desc" } },
    });

    res.json({
      documents: shares.map((share: (typeof shares)[number]) =>
        publicDocument({
          ...share.document,
          permission: share.permission,
        }),
      ),
    });
  } catch (error) {
    next(error);
  }
});

documentsRouter.get("/:id", async (req, res, next) => {
  try {
    const access = await requireDocumentAccess(req.user!.id, req.params.id, "VIEW");
    const document = await prisma.document.findUniqueOrThrow({
      where: { id: access.documentId },
      include: { owner: { select: { id: true, name: true, email: true } } },
    });

    res.json({
      document: publicDocument({ ...document, permission: access.access }),
    });
  } catch (error) {
    next(error);
  }
});

documentsRouter.patch("/:id", async (req, res, next) => {
  try {
    await requireDocumentAccess(req.user!.id, req.params.id, "EDIT");

    const data: Prisma.DocumentUpdateInput = {};

    if (req.body?.title !== undefined) {
      if (typeof req.body.title !== "string" || !req.body.title.trim()) {
        throw badRequest("title must be a non-empty string");
      }
      data.title = req.body.title.trim();
    }

    if (req.body?.content !== undefined) {
      if (!isPlainObject(req.body.content) && !Array.isArray(req.body.content)) {
        throw badRequest("content must be valid Tiptap JSON");
      }
      data.content = req.body.content as Prisma.InputJsonValue;
    }

    if (Object.keys(data).length === 0) {
      throw badRequest("Provide title and/or content to update");
    }

    const document = await prisma.document.update({
      where: { id: req.params.id },
      data,
      include: { owner: { select: { id: true, name: true, email: true } } },
    });

    const access = await requireDocumentAccess(req.user!.id, document.id, "VIEW");
    res.json({ document: publicDocument({ ...document, permission: access.access }) });
  } catch (error) {
    next(error);
  }
});

documentsRouter.delete("/:id", async (req, res, next) => {
  try {
    await requireDocumentAccess(req.user!.id, req.params.id, "OWNER");
    await prisma.document.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

documentsRouter.get("/:id/shares", async (req, res, next) => {
  try {
    await requireDocumentAccess(req.user!.id, req.params.id, "OWNER");
    const shares = await prisma.documentShare.findMany({
      where: { documentId: req.params.id },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { id: "asc" },
    });
    res.json({ shares: shares.map(publicShare) });
  } catch (error) {
    next(error);
  }
});

documentsRouter.post("/:id/shares", async (req, res, next) => {
  try {
    await requireDocumentAccess(req.user!.id, req.params.id, "OWNER");

    const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const permission = req.body?.permission;

    if (!email) {
      throw badRequest("email is required");
    }
    if (permission !== Permission.VIEW && permission !== Permission.EDIT) {
      throw badRequest("permission must be VIEW or EDIT");
    }

    const target = await prisma.user.findUnique({ where: { email } });
    if (!target) {
      throw notFound("User not found");
    }
    if (target.id === req.user!.id) {
      throw badRequest("Cannot share a document with yourself");
    }

    const share = await prisma.documentShare.upsert({
      where: {
        documentId_userId: {
          documentId: req.params.id,
          userId: target.id,
        },
      },
      create: {
        documentId: req.params.id,
        userId: target.id,
        permission,
      },
      update: { permission },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    res.status(201).json({ share: publicShare(share) });
  } catch (error) {
    next(error);
  }
});

documentsRouter.delete("/:id/shares/:shareId", async (req, res, next) => {
  try {
    await requireDocumentAccess(req.user!.id, req.params.id, "OWNER");

    const share = await prisma.documentShare.findFirst({
      where: { id: req.params.shareId, documentId: req.params.id },
    });
    if (!share) {
      throw notFound("Share not found");
    }

    await prisma.documentShare.delete({ where: { id: share.id } });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});
