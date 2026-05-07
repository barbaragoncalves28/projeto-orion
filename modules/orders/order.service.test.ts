import { updateOrderStatusService } from "./order.service";

test("não permite transição inválida", async () => {
  await expect(
    updateOrderStatusService({
      orderId: "fake",
      newStatus: "delivered",
      userId: "1",
      role: "admin",
    })
  ).rejects.toThrow();
});