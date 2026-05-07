import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center p-6">
      <h1 className="text-4xl font-bold">
        Order Management System
      </h1>

      <p className="text-gray-600 mt-2">
        Sistema completo de pedidos com backend robusto
      </p>

      <div className="mt-6 flex gap-4">
        <Link
          href="/login"
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Login
        </Link>

        <Link
          href="/register"
          className="bg-gray-800 text-white px-4 py-2 rounded"
        >
          Criar conta
        </Link>
      </div>
    </div>
  );
}