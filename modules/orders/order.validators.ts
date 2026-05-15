import { z } from "zod";

const uuidMessage = "ID inválido";

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

export const paymentMethodSchema = z.enum([
  "pix",
  "dinheiro",
  "debito",
  "credito",
]);

export const deliveryTypeSchema = z.enum([
  "delivery",
  "pickup",
]);

export const createOrderItemSchema = z
  .object({
    productId: z.string().uuid(uuidMessage),

    quantity: z
      .number()
      .int("Quantidade deve ser um número inteiro")
      .positive("Quantidade deve ser maior que zero")
      .max(99, "Quantidade máxima por item é 99"),
  })
  .strict();
 
export const createOrderSchema = z
  .object({
    restaurantId: z.string().uuid(uuidMessage),

    customerName: z
      .string()
      .min(2, "Nome do cliente obrigatório")
      .max(255, "Nome muito grande"),

    customerPhone: z
      .string()
      .min(8, "Telefone inválido")
      .max(30, "Telefone muito grande"),

    paymentMethod: paymentMethodSchema,

    notes: z
      .string()
      .max(500, "Observação muito grande")
      .optional(),

    deliveryType: deliveryTypeSchema,

    deliveryAddress: z
      .string()
      .max(255, "Endereço muito grande")
      .optional(),

      estimatedDeliveryAt: z
      .string()
      .datetime("Data/horário inválido")
      .optional(),

    items: z
      .array(createOrderItemSchema)
      .min(1, "Pedido deve ter ao menos um item")
      .max(100, "Pedido não pode ter mais de 100 itens"),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (
      data.deliveryType === "delivery" &&
      (!data.deliveryAddress || data.deliveryAddress.trim().length < 5)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["deliveryAddress"],
        message: "Endereço obrigatório para entrega",
      });
    }
  });
 
export const updateOrderStatusSchema = z
  .object({
    orderId: z.string().uuid(uuidMessage),
    newStatus: orderStatusSchema,
    userId: z.string().uuid(uuidMessage),
    role: z.enum(["customer", "vendor", "admin"]),
  })
  .strict();
 
export const getOrderByIdSchema = z
  .object({ 
    orderId: z.string().uuid(uuidMessage),
  })
  .strict();
 
export const cancelOrderSchema = z
  .object({
    orderId: z.string().uuid(uuidMessage),
    userId: z.string().uuid(uuidMessage),
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

export type CreateOrderInput = z.infer<typeof createOrderSchema> & {
  userId: string;
};
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
