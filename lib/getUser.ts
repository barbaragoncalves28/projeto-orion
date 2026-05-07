import { cookies } from "next/headers";
import { verifyToken } from "./auth";

export type AuthenticatedUser = {
  id: string;
  role: "customer" | "vendor" | "admin";
};

export async function getUserFromRequest(): Promise<AuthenticatedUser> {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  console.log("TOKEN:", token);

  if (!token) {
    throw new Error("Não autenticado");
  }

  const user = verifyToken(token) as AuthenticatedUser;

  console.log("USUARIO LOGADO:", user);

  return user;
}
