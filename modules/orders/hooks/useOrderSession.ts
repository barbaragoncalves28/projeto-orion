"use client";

import { useEffect, useState } from "react";

const storageKey = "orion-order-session";

type OrderSession = {
  userId: string;
  role: "customer" | "vendor" | "admin";
};

const initialSession: OrderSession = {
  userId: "",
  role: "customer",
};

export function useOrderSession() {
  const [session, setSession] = useState<OrderSession>(initialSession);

  useEffect(() => {
    const stored = window.localStorage.getItem(storageKey);

    if (stored) {
      setSession(JSON.parse(stored) as OrderSession);
    }
  }, []);

  function updateSession(nextSession: OrderSession) {
    setSession(nextSession);
    window.localStorage.setItem(storageKey, JSON.stringify(nextSession));
  }

  return {
    session,
    updateSession,
  };
}
