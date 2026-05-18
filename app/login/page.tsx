"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FaEnvelope, FaLock, FaEye, FaEyeSlash,
} from "react-icons/fa";
import toast from "react-hot-toast";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const router = useRouter(); 

  async function handleLogin() {
    setError("");

    if (!email || !password) {
      setError("Preencha email e senha");
      return;
    }

    if (email.toLowerCase() !== "admin@gmail.com") {
    setError("Credenciais inválidas");
    return;
  }

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    console.log("status login:", res.status);

    if (res.ok) {
      toast.success("Login realizado com sucesso!");

      setTimeout(() => {
        router.push("/orders");
        router.refresh();
        }, 1500);
    return;
  } 

  setError("Credenciais inválidas");

  }

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden px-6">

    <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: "url('/images/background.png')",
        }}
      />

      <div className="absolute inset-0 bg-black/55" />

      <div className="relative z-10 w-full max-w-md rounded-3xl border border-white/20 bg-white/10 backdrop-blur-2xl shadow-2xl shadow-black/40 p-8">
      <h1 className="text-3xl font-bold text-white mb-8 flex justify-center">
          Login
      </h1>

      <p className="text-slate-400 mb-6 justify-center flex">
          Entre para acessar seu painel de pedidos.
      </p>

      <div className="relative mb-3">
        <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
      <input
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full rounded-xl border border-slate-100 bg-white pl-12 pr-4 py-3 placeholder:text-slate-500 outline-none transition focus:border-blue-200 focus:ring-2 focus:ring-blue-200/20"
      />
      </div>  

    <div className="relative mb-5">
      <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
      <input
        type={showPassword ? "text" : "password"}
        placeholder="Senha"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full rounded-xl border border-slate-100 bg-white pl-12 pr-12 py-3 placeholder:text-slate-500 outline-none transition focus:border-blue-200 focus:ring-2 focus:ring-blue-200/20"
      />

      <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition cursor-pointer"
          >
            {showPassword ? <FaEye /> : <FaEyeSlash />}
          </button>
      </div>

      {error && (
        <p className="text-red-400 text-sm mb-4 text-center">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={handleLogin}
        className="cursor-pointer w-full inline-flex h-12 items-center justify-center rounded-xl bg-blue-600 px-8 font-semibold text-white shadow-lg shadow-blue-600/25 transition-all duration-300 hover:bg-blue-500"
      >
        Entrar
      </button>

      <div className="mt-5 text-center">
        <Link
          href="/"
          className="text-sm text-slate-300 hover:text-slate-200 transition underline underline-offset-4"
      >
            Voltar ao início
        </Link>
        </div>
      </div>
    </div>
  );
}