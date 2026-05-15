"use client";

import { useState } from "react";
import { FaUser, FaEnvelope, FaLock, FaEye, FaEyeSlash, } from "react-icons/fa";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  async function handleRegister() {
    await fetch("/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        email,
        password,
      }),
    });

    window.location.href = "/login";
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: "url('/images/background.png')",
        }}
      />

        <div className="absolute inset-0 bg-black/55" />

      <div className="relative z-10 w-full max-w-md rounded-3xl border border-white/20 bg-white/10 backdrop-blur-2xl shadow-2xl shadow-black/40 p-8">
        <h1 className="text-3xl font-bold text-white mb-8 justify-center flex">
          Criar conta
        </h1>

         <p className="text-slate-400 mb-6">
          Cadastre-se para começar a gerenciar seus pedidos.
        </p>

      <div className="relative mb-3">
        <FaUser className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"/>    
        <input
          placeholder="Nome"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-xl border border-slate-100 bg-white pl-12 pr-4 py-3 placeholder:text-slate-500 outline-none transition focus:border-blue-200 focus:ring-2 focus:ring-blue-200/20"
        />
      </div>

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
          className="w-full rounded-xl border border-slate-100 bg-slate-100 pl-12 pr-4 py-3 placeholder:text-slate-500 outline-none transition focus:border-blue-200 focus:ring-2 focus:ring-blue-200/20"
        /> 

        <button
    type="button"
    onClick={() => setShowPassword(!showPassword)}
    className="cursor-pointer absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
  >
    {showPassword ? <FaEye /> : <FaEyeSlash /> }
  </button> 
      </div>

        <button
          onClick={handleRegister}
          className="cursor-pointer w-full inline-flex h-12 items-center justify-center rounded-xl bg-blue-600 px-8 font-semibold text-white shadow-lg shadow-blue-600/25 transition-all duration-300 hover:bg-blue-500"
        >
          Criar conta
        </button>
      </div>
    </div>
  );
}