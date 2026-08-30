export type UserRole = "user" | "host" | "admin";
export type UserStatus = "active" | "blocked";

export interface User {
  _id: string;
  username: string;
  email?: string;
  googleId?: string;
  displayName?: string;
  avatarUrl?: string;
  avatarId?: string;
  bio?: string;
  status: UserStatus;
  role: UserRole;
  phone?: string;
  createdAt?: string;
  updatedAt?: string;
}
