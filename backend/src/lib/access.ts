import type { Permission } from "@prisma/client";
import { prisma } from "../db.js";
import { forbidden, notFound } from "./errors.js";

export type DocumentAccess = "OWNER" | Permission;

export async function getDocumentAccess(
  userId: string,
  documentId: string,
): Promise<{ access: DocumentAccess; documentId: string } | null> {
  const document = await prisma.document.findUnique({
    where: { id: documentId },
    select: {
      id: true,
      ownerId: true,
      shares: {
        where: { userId },
        select: { permission: true },
        take: 1,
      },
    },
  });

  if (!document) {
    return null;
  }

  if (document.ownerId === userId) {
    return { access: "OWNER", documentId: document.id };
  }

  const share = document.shares[0];
  if (!share) {
    return null;
  }

  return { access: share.permission, documentId: document.id };
}

export async function requireDocumentAccess(
  userId: string,
  documentId: string,
  minimum: "VIEW" | "EDIT" | "OWNER",
) {
  const result = await getDocumentAccess(userId, documentId);
  if (!result) {
    // Hide existence from unauthorized users
    throw notFound("Document not found");
  }

  const rank = { VIEW: 1, EDIT: 2, OWNER: 3 } as const;
  const accessRank = result.access === "OWNER" ? 3 : rank[result.access];
  const needed = rank[minimum];

  if (accessRank < needed) {
    throw forbidden("Insufficient permission");
  }

  return result;
}
