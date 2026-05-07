import { pool } from "@/lib/db";
import { comparePassword } from "@/lib/hash";
import { signToken } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { email, password } = await req.json();

  const res = await pool.query(
    `SELECT * FROM users WHERE email = $1`,
    [email]
  );

  const user = res.rows[0];

  if (!user) {
    return NextResponse.json(
      { error: "Usuário inválido" },
      { status: 401 }
    );
  }

  const valid = await comparePassword(password, user.password_hash);

  if (!valid) {
    return NextResponse.json(
      { error: "Senha inválida" },
      { status: 401 }
    );
  }

  const token = signToken({
    id: user.id,
    role: user.role,
  });

  const response = NextResponse.json({ message: "Login OK" });

  response.cookies.set("token", token, {
    httpOnly: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
    sameSite: "lax",
  });

  return response;
}