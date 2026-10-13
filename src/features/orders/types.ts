import type { Quote } from "@/features/quotes/types";

/**
 * Model zamówienia — fundament pod przyszły moduł zamówień i płatności.
 * Produkcję realizują współpracujące zakłady; VEXOR organizuje proces.
 */

export type OrderStatus =
  | "awaiting-payment"
  | "paid"
  | "in-production"
  | "quality-check"
  | "shipped"
  | "delivered"
  | "cancelled";

export type ShippingAddress = {
  name: string;
  company?: string;
  street: string;
  postalCode: string;
  city: string;
  country: "PL";
  phone?: string;
};

export type Order = {
  id: string;
  quoteId: Quote["id"];
  status: OrderStatus;
  shippingAddress: ShippingAddress;
  createdAt: string;
  /** Identyfikator zakładu produkcyjnego — wewnętrzny, niewidoczny dla klienta. */
  manufacturerId?: string;
  trackingNumber?: string;
};
