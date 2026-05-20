import Link from "next/link";

export default function Home() {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 py-10 overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: "url('/images/background.png')",
        }}
      />
      <div className="absolute inset-0 bg-black/55" />

      <div className="relative z-10 w-full max-w-3xl">      
      <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight text-white leading-tight">
        Order Management System
      </h1>

      <p className="mt-5 max-w-xl mx-auto text-base sm:text-lg leading-7 sm:leading-8 text-slate-300">
        Simplifique sua operação e acompanhe cada pedido em tempo real.
      </p>

      <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center items-center">
        <Link
          href="/login"
          className="w-full sm:w-auto inline-flex h-12 items-center justify-center rounded-xl bg-blue-600 px-8 font-semibold text-white shadow-lg shadow-blue-600/25 transition-all duration-300 hover:bg-blue-500"
        >
          Login
        </Link>

        <Link
          href="/register"
          className="w-full sm:w-auto inline-flex h-12 items-center justify-center rounded-xl bg-blue-600 px-8 font-semibold text-white shadow-lg shadow-blue-600/25 transition-all duration-300 hover:bg-blue-500"
        >
          Criar conta
        </Link>
      </div>
    </div>
    </div>
  );
}