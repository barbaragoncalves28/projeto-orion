"use client";

import { useEffect, useState, useMemo } from "react";
import toast from "react-hot-toast";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createOrder } from "../order.api-client";
import type { DraftOrderItem } from "../order.ui-types";
import { OrderFeedback } from "./OrderFeedback";
import { FaPlus, FaTrash } from "react-icons/fa";
import { formatPhone, } from "../order.ui";
import { PageHeader } from "./PageHeader";

type Restaurant = {
  id: number;
  name: string;
  description: string;
};

type PaymentMethod = {
  id: string;
  name: string;
};

type OrderType = {
  id: "delivery" | "pickup";
  name: string;
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

const DELIVERY_FEE = 8;

export function CreateOrderView() {
  const router = useRouter();
 
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [restaurantId, setRestaurantId] = useState("");
  const [items, setItems] = useState<DraftOrderItem[]>([{ ...emptyItem }]);

  const [customerName, setCustomerName] = useState(""); 
  const [customerPhone, setCustomerPhone] = useState("");
  
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [notes, setNotes] = useState("");
  const [orderTypes, setOrderTypes] = useState<OrderType[]>([]);
  const [deliveryType, setDeliveryType] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [estimatedDeliveryAt, setEstimatedDeliveryAt] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subtotal = useMemo(() => {
    return items.reduce((acc, item) => {
      const product = products.find((p) => p.id === Number(item.productId));
      if (!product) return acc;

      return acc + Number(product.price) * item.quantity;
    }, 0);
  }, [items, products]);

  const deliveryFee = deliveryType === "delivery" ? DELIVERY_FEE : 0;
  const total = subtotal + deliveryFee;

  const [success, setSuccess] = useState<string | null>(null);

  const canSubmit =
  restaurantId &&
  customerName.trim() &&
  customerPhone.trim() &&
  paymentMethod &&
  deliveryType &&
  items.length > 0 &&
  items.every((item) => item.productId && item.quantity > 0) &&
    (deliveryType === "pickup" || deliveryAddress.trim());

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
  async function loadPaymentMethods() {
    try {
      const res = await fetch("/api/payment-methods");
      const data = await res.json();

      setPaymentMethods(data);
      setPaymentMethod(""); // começa vazio
    } catch {
      setError("Erro ao carregar formas de pagamento");
    }
  }

  loadPaymentMethods();
}, []);

useEffect(() => {
  async function loadOrderTypes() {
    try {
      const res = await fetch("/api/order-types");
      const data = await res.json();

      setOrderTypes(data);
      setDeliveryType("");
    } catch {
      setError("Erro ao carregar tipos de pedido");
    }
  }

  loadOrderTypes();
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
  setIsSubmitting(true);

  try {
    const order = await createOrder({
      restaurantId,
      customerName,
      customerPhone: customerPhone.replace(/\D/g, ""),
      paymentMethod,
      notes,
      deliveryType: deliveryType as "delivery" | "pickup",
      deliveryAddress:
      deliveryType ===  "delivery" ? deliveryAddress : undefined,
      estimatedDeliveryAt: estimatedDeliveryAt ? new Date(estimatedDeliveryAt).toISOString() : undefined,
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
    <main className="min-h-screen bg-gray-50 mx-auto grid w-full gap-6 px-4 py-8 sm:px-6 lg:px-20">
      <header>
        <PageHeader title="Novo pedido" />
      </header>

      <OrderFeedback error={error} success={success} />

      <form
        onSubmit={handleSubmit}
        className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Informações do cliente
          </h2>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium text-slate-700">
              Nome do cliente:
            </label>
            <input placeholder="Ex: Maria Silva" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="w-full h-11 rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium text-slate-700">
              Telefone:
            </label> 
              <input placeholder="(00) 00000-0000" value={customerPhone} onChange={(e) => setCustomerPhone(formatPhone(e.target.value))}
  maxLength={15} className="w-full h-11 rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"/>
          </div>  

          <div className="grid gap-2">
              <label className="text-sm font-medium text-slate-700">
              Forma de pagamento:
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              className="h-11 rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="">Selecione</option>

            {paymentMethods.map((method) => (
    <option key={method.id} value={method.id}>
      {method.name}
    </option>
  ))}
        </select>
            </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium text-slate-700">
              Tipo de pedido:
            </label>
            <select
                value={deliveryType}
                onChange={(e) => setDeliveryType(e.target.value)}
                className="w-full h-11 rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="">Selecione</option>

                {orderTypes.map((type) => (
    <option key={type.id} value={type.id}>
      {type.name}
    </option>
  ))} 
        </select> 
          </div>
          </div>

          {deliveryType === "delivery" && (
            <div className="grid gap-2 mt-4">
              <label className="text-sm font-medium text-slate-700">
                Endereço de entrega:
              </label>
              <textarea
                placeholder="Endereço de entrega"
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                rows={3}
                className="rounded-xl border px-4 py-3 border-slate-300 bg-white text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20
                "
              />
              </div>
            )}

        </section>

        <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Informações do pedido
          </h2>

          <div>
            <div className="grid gap-2">
              <label className="text-sm font-medium text-slate-700">
                Restaurante:
              </label>
              <select
                value={restaurantId}
                onChange={(event) => setRestaurantId(event.target.value)}
                className="w-full h-11 rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              >
              <option value="">Selecione</option>

              {restaurants.map((restaurant) => (
                <option
                  key={restaurant.id}
                  value={restaurant.id}
                >
                  {restaurant.name}
                </option>
              ))}
          </select>
          </div>

          <div className="grid gap-2 mt-4">
            <label className="text-sm font-medium text-slate-700">
              Itens do pedido:
            </label> 

            <section className="gap-3">
          

          <div className="grid gap-3">
            {items.map((item, index) => (
              <div
                key={index}
                className="grid gap-3 p-4 rounded-2xl border border-slate-200 bg-white shadow-sm grid-cols-1 sm:grid-cols-[1fr_120px_auto]"
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
                  className="h-10 w-10 disabled:opacity-40 disabled:cursor-not-allowed border border-red-200 bg-red-50 text-red-600 rounded-xl inline-flex items-center justify-center transition-all duration-300 hover:bg-red-100 hover:text-red-700 cursor-pointer"
                >
                  <FaTrash size={14} />
                </button>
              </div>
            ))}
          </div>
          <div className="mt-4">

            <button
              type="button"
              onClick={() =>
                setItems((current) => [
                  ...current,
                  { ...emptyItem },
                ])
              }
              disabled={!restaurantId}
              className="gap-2 h-9 px-4 text-sm disabled:opacity-40 disabled:cursor-not-allowed border border-green-600
            cursor-pointer inline-flex items-center justify-center rounded-xl bg-green-600 font-semibold text-white shadow-lg shadow-green-600/25 transition-all duration-300 hover:bg-green-500
              "
            >
              <FaPlus size={12} />
              <span>Adicionar item</span>
            </button>
          </div>
        </section>
              
          </div>

          <div className="grid gap-2 mt-8">
            <label className="text-sm font-medium text-slate-700">
              Notas do pedido (opcional):
            </label>
            <textarea
              placeholder="Observações"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="py-3 rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>


          <div className="w-full rounded-xl border border-slate-300 bg-slate-100 p-4 shadow-sm mt-4">
  <h3 className="text-sm font-bold uppercase tracking-wide text-slate-700 mb-4">
    Resumo do pedido
  </h3>

  <div className="space-y-3 text-sm">
    <div className="flex items-center justify-between">
      <span className="text-slate-600">Subtotal</span>
      <span className="font-medium text-slate-900">
        R$ {subtotal.toFixed(2)}
      </span>
    </div>

    <div className="flex items-center justify-between">
      <span className="text-slate-600">Taxa de entrega</span>
      <span className="font-medium text-slate-900">
        R$ {deliveryFee.toFixed(2)}
      </span>
    </div>

    <div className="border-t border-slate-300 pt-3 mt-3">
      <div className="flex items-center justify-between">
        <span className="text-base font-bold text-slate-900">
          Total Geral
        </span>
        <span className="text-lg font-bold text-slate-900">
          R$ {total.toFixed(2)}
        </span>
      </div>
    </div>
  </div>
</div>
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
            className="h-10 px-4 disabled:opacity-40 disabled:cursor-not-allowed border border-blue-600 cursor-pointer inline-flex items-center justify-center rounded-xl bg-blue-600 font-semibold text-white shadow-lg shadow-blue-600/25 transition-all duration-300 hover:bg-blue-500"
          >
            {isSubmitting ? "Criando..." : "Criar pedido"}
          </button>
        </div>
      </form>
    </main>
  );
}