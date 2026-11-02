export type Permission = "OWNER" | "VIEW" | "EDIT";

export type User = {
  id: string;
  name: string;
  email: string;
  createdAt?: string;
};

export type DocumentSummary = {
  id: string;
  title: string;
  content: unknown;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  permission?: Permission;
  owner?: Pick<User, "id" | "name" | "email">;
};

export type DocumentShare = {
  id: string;
  documentId: string;
  userId: string;
  permission: "VIEW" | "EDIT";
  user?: Pick<User, "id" | "name" | "email">;
};

export type LoginResponse = {
  token: string;
  user: User;
};

export type ApiErrorBody = {
  error?: string;
};
