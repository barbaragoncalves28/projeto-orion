"use client";

import { useEffect, useState } from "react";
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

      setSuccess("Pedido criado com sucesso.");
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
    <main className="mx-auto grid w-full max-w-4xl gap-5 px-4 py-5 sm:px-6 lg:px-8">
      <header>
        <p className="text-sm font-medium text-slate-500">Pedidos</p>
        <h1 className="text-2xl font-semibold text-slate-950">
          Novo pedido
        </h1>
      </header>

      <OrderFeedback error={error} success={success} />

      <form
        onSubmit={handleSubmit}
        className="grid gap-5 rounded border border-slate-200 bg-white p-4"
      >
        <section className="grid gap-4">
          <h2 className="text-sm font-semibold text-slate-950">
            Restaurante
          </h2>

          <select
            value={restaurantId}
            onChange={(event) => setRestaurantId(event.target.value)}
            className="h-10 rounded border border-slate-300 px-3 text-sm outline-none focus:border-slate-900"
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

        <section className="grid gap-4">
            <h2 className="text-sm font-semibold text-slate-950">Entrega</h2>

            <textarea
              value={deliveryAddress}
              onChange={(event) =>
              setDeliveryAddress(event.target.value)
            }
            placeholder="Rua, número, bairro, cidade"
            rows={3}
            className="rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
          />
        </section>

        <section className="grid gap-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-slate-950">
              Itens
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
              className="h-9 rounded border border-slate-300 px-3 text-sm font-medium text-slate-700 disabled:opacity-50"
            >
              Adicionar item
            </button>
          </div>

          <div className="grid gap-3">
            {items.map((item, index) => (
              <div
                key={index}
                className="grid gap-3 rounded border border-slate-200 p-3 sm:grid-cols-[1fr_120px_auto]"
              >
                <select
                  value={item.productId}
                  onChange={(event) =>
                    updateItem(index, {
                      ...item,
                      productId: event.target.value,
                    })
                  }
                  className="h-10 rounded border border-slate-300 px-3 text-sm"
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
                  className="h-10 rounded border border-slate-300 px-3 text-sm"
                />

                <button
                  type="button"
                  disabled={items.length === 1}
                  onClick={() => removeItem(index)}
                  className="h-10 rounded border border-slate-300 px-3 text-sm font-medium text-slate-700 disabled:opacity-40"
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
            className="h-10 rounded border border-slate-300 px-4 text-sm font-medium text-slate-700"
          >
            Cancelar
          </button>

          <button
            type="submit"
            disabled={!canSubmit || isSubmitting}
            className="h-10 rounded bg-slate-950 px-4 text-sm font-medium text-white disabled:bg-slate-300"
          >
            {isSubmitting ? "Criando..." : "Criar pedido"}
          </button>
        </div>
      </form>
    </main>
  );
}