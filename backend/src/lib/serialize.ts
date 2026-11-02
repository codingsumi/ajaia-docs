import type { Document, DocumentShare, User } from "@prisma/client";

export function publicUser(user: Pick<User, "id" | "name" | "email" | "createdAt">) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
  };
}

export function publicDocument(
  document: Document & {
    owner?: Pick<User, "id" | "name" | "email">;
    permission?: "OWNER" | "VIEW" | "EDIT";
  },
) {
  return {
    id: document.id,
    title: document.title,
    content: document.content,
    ownerId: document.ownerId,
    createdAt: document.createdAt,
    updatedAt: document.updatedAt,
    ...(document.owner
      ? {
          owner: {
            id: document.owner.id,
            name: document.owner.name,
            email: document.owner.email,
          },
        }
      : {}),
    ...(document.permission ? { permission: document.permission } : {}),
  };
}

export function publicShare(
  share: DocumentShare & {
    user?: Pick<User, "id" | "name" | "email">;
  },
) {
  return {
    id: share.id,
    documentId: share.documentId,
    userId: share.userId,
    permission: share.permission,
    ...(share.user
      ? {
          user: {
            id: share.user.id,
            name: share.user.name,
            email: share.user.email,
          },
        }
      : {}),
  };
}
