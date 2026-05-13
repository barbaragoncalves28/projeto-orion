"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createOrder } from "../order.api-client";
import type { DraftOrderItem } from "../order.ui-types";
import { OrderFeedback } from "./OrderFeedback";

type Restaurant = {
  id: number;
  name: string;
  description: string;
};

type Product = {
  id: number;
  name: string;
  description: string;
  price: string;
};

const emptyItem: DraftOrderItem = {
  productId: "",
  quantity: 1,
};

export function CreateOrderView() {
  const router = useRouter();

  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [restaurantId, setRestaurantId] = useState("");
  const [items, setItems] = useState<DraftOrderItem[]>([{ ...emptyItem }]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [deliveryAddress, setDeliveryAddress] = useState("");

  const canSubmit =
  restaurantId &&
  deliveryAddress.trim() &&
  items.length > 0 &&
  items.every((item) => item.productId && item.quantity > 0);

  useEffect(() => {
    async function loadRestaurants() {
      try {
        const res = await fetch("/api/restaurants");
        const data = await res.json();
        setRestaurants(data);
      } catch {
        setError("Erro ao carregar restaurantes");
      }
    }

    loadRestaurants();
  }, []);

  useEffect(() => {
    if (!restaurantId) {
      setProducts([]);
      return;
    }

    async function loadProducts() {
      try {
        const res = await fetch(
          `/api/restaurants/${restaurantId}/products`
        );

        const data = await res.json();
        setProducts(data);

        // limpa itens ao trocar restaurante
        setItems([{ ...emptyItem }]);
      } catch {
        setError("Erro ao carregar produtos");
      }
    }

    loadProducts();
  }, [restaurantId]);

  function updateItem(index: number, nextItem: DraftOrderItem) {
    setItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? nextItem : item
      )
    );
  }

  function removeItem(index: number) {
    setItems((current) =>
      current.filter((_, itemIndex) => itemIndex !== index)
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
  event.preventDefault();
  setError(null);
  setSuccess(null);
  setIsSubmitting(true);

  try {
    const order = await createOrder({
      restaurantId,
      deliveryAddress,
      items,
    });

    toast.success("Pedido criado com sucesso.");
    router.push(`/orders/${order.id}`);
  } catch (err) {
    setError(
      err instanceof Error ? err.message : "Erro ao criar pedido"
    );
  } finally {
    setIsSubmitting(false);
  }
}

  return (
    <main className="min-h-screen bg-slate-50 mx-auto w-full gap-6 px-4 py-8 sm:px-6 lg:px-20">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-7">
          Novo pedido
        </h1>
      </header>

      <OrderFeedback error={error} success={success} />

      <form
        onSubmit={handleSubmit}
        className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <section className="gap-4">
          <h2 className="font-medium text-slate-700 mb-2">
            Restaurante:
          </h2>

          <select
            value={restaurantId}
            onChange={(event) => setRestaurantId(event.target.value)}
            className="w-full h-11 rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="">Selecione um restaurante</option>

            {restaurants.map((restaurant) => (
              <option
                key={restaurant.id}
                value={restaurant.id}
              >
                {restaurant.name}
              </option>
            ))}
          </select>
        </section> 

        <section className="grid">
            <h2 className="font-medium text-slate-700 mb-2">Endereço de entrega:</h2>

            <textarea
              value={deliveryAddress}
              onChange={(event) =>
              setDeliveryAddress(event.target.value)
            }
            placeholder="Rua, número, bairro, cidade"
            rows={3}
            className="py-2 rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
        </section>

        <section className="gap-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-medium text-slate-700 mt-10 mb-2">
              Itens do pedido:
            </h2>

            <button
              type="button"
              onClick={() =>
                setItems((current) => [
                  ...current,
                  { ...emptyItem },
                ])
              }
              disabled={!restaurantId}
              className="h-9 px-3 text-sm disabled:opacity-50 border border-green-600
            cursor-pointer inline-flex items-center justify-center rounded-xl bg-green-600 font-semibold text-white shadow-lg shadow-green-600/25 transition-all duration-300 hover:bg-green-500
              "
            >
              Adicionar item
            </button>
          </div>

          <div className="grid gap-3">
            {items.map((item, index) => (
              <div
                key={index}
                className="grid gap-3 p-4 sm:grid-cols-[1fr_120px_auto] rounded-2xl border border-slate-200 bg-white shadow-sm"
              >
                <select
                  value={item.productId}
                  onChange={(event) =>
                    updateItem(index, {
                      ...item,
                      productId: event.target.value,
                    })
                  }
                  className="h-11 rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="">Selecione um produto</option>

                  {products.map((product) => (
                    <option
                      key={product.id}
                      value={product.id}
                    >
                      {product.name} - R$ {product.price}
                    </option>
                  ))}
                </select>

                <input
                  type="number"
                  min={1}
                  value={item.quantity}
                  onChange={(event) =>
                    updateItem(index, {
                      ...item,
                      quantity: Number(event.target.value),
                    })
                  }
                  className="h-10 px-3 text-sm
                  rounded-xl border border-slate-300 bg-white text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />

                <button
                  type="button"
                  disabled={items.length === 1}
                  onClick={() => removeItem(index)}
                  className="h-10 px-3 text-sm disabled:opacity-50 border border-red-600 cursor-pointer inline-flex items-center justify-center rounded-xl bg-red-600  font-semibold text-white shadow-lg shadow-red-600/25 transition-all duration-300 hover:bg-red-500"
                >
                  Remover
                </button>
              </div>
            ))}
          </div>
        </section>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => router.push("/orders")}
            className="border border-red-600
            cursor-pointer inline-flex h-10 items-center justify-center rounded-xl bg-red-600 px-4 font-semibold text-white shadow-lg shadow-red-600/25 transition-all duration-300 hover:bg-red-500"
          >
            Cancelar
          </button>

          <button
            type="submit"
            disabled={!canSubmit || isSubmitting}
            className="h-10 px-4 text-sm disabled:opacity-50 border border-blue-600 cursor-pointer inline-flex items-center justify-center rounded-xl bg-blue-600 font-semibold text-white shadow-lg shadow-blue-600/25 transition-all duration-300 hover:bg-blue-500"
          >
            {isSubmitting ? "Criando..." : "Criar pedido"}
          </button>
        </div>
      </form>
    </main>
  );
}