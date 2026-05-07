import { z } from "zod";

export const orderStatusSchema = z.enum([
  "confirmed",
  "preparing",
  "out_for_delivery",
  "delivered",
  "cancelled",
]);

export const listOrderStatusSchema = z.enum([
  "pending",
  "confirmed",
  "preparing",
  "out_for_delivery",
  "delivered",
  "cancelled",
]);

export const createOrderItemSchema = z
  .object({
    productId: z.coerce.number().int().positive(),

    quantity: z
      .number()
      .int("Quantidade deve ser um número inteiro")
      .positive("Quantidade deve ser maior que zero")
      .max(99, "Quantidade máxima por item é 99"),
  })
  .strict();

export const createOrderSchema = z
  .object({
    restaurantId: z.coerce.number().int().positive(),

    address: z
      .string()
      .min(5, "Endereço obrigatório")
      .max(255, "Endereço muito grande"),

    items: z
      .array(createOrderItemSchema)
      .min(1, "Pedido deve ter ao menos um item")
      .max(100, "Pedido não pode ter mais de 100 itens"),
  })
  .strict();

export const updateOrderStatusSchema = z
  .object({
    orderId: z.string().uuid("ID inválido"),
    newStatus: orderStatusSchema,
    userId: z.string().uuid("ID inválido"),
    role: z.enum(["customer", "vendor", "admin"]),
  })
  .strict();

export const getOrderByIdSchema = z
  .object({
    orderId: z.string().uuid("ID inválido"),
  })
  .strict();

export const cancelOrderSchema = z
  .object({
    orderId: z.string().uuid("ID inválido"),
    userId: z.string().uuid("ID inválido"),
    role: z.enum(["customer", "vendor", "admin"]),
  })
  .strict();

export const listOrdersSchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(10),
    status: listOrderStatusSchema.optional(),
  })
  .strict();

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
export type GetOrderByIdInput = z.infer<typeof getOrderByIdSchema>;
export type CancelOrderInput = z.infer<typeof cancelOrderSchema>;
export type ListOrdersInput = z.infer<typeof listOrdersSchema>;

export function formatZodError(error: z.ZodError) {
  return error.issues.map((issue) => ({
    field: issue.path.join(".") || "body",
    message:
      issue.code === "unrecognized_keys"
        ? "Campos desconhecidos não são permitidos"
        : issue.message,
  }));
}
