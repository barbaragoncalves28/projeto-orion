import { NextResponse } from "next/server";
import { findAllPaymentMethods } from "./payment-method.repository";

export async function listPaymentMethodsController() {
  try {
    const methods = await findAllPaymentMethods();
    return NextResponse.json(methods);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Erro ao buscar formas de pagamento" },
      { status: 500 }
    );
  }
}