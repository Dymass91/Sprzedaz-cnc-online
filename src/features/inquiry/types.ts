import type { ConfigurationSnapshot } from "@/features/configurator/snapshot";

export type InquiryContact = {
  fullName: string;
  email: string;
  phone: string;
  company: string;
  notes: string;
  /** Zgoda na przetwarzanie danych w celu przygotowania wyceny. */
  consent: boolean;
};

export type InquiryField = keyof InquiryContact;

export type InquiryErrors = Partial<Record<InquiryField, string>>;

/**
 * Ładunek zapytania dla przyszłego API. Plik modelu zostanie przesłany
 * osobno (upload do magazynu plików, np. R2/S3 z podpisanym adresem),
 * a tutaj trafi tylko jego identyfikator.
 */
export type InquiryPayload = {
  contact: InquiryContact;
  configuration: ConfigurationSnapshot;
  /** Identyfikator pliku w magazynie — po wdrożeniu uploadu. */
  modelFileId: string | null;
};

export type InquirySubmitResult =
  | { status: "submitted"; inquiryId: string }
  | { status: "not-connected" }
  | { status: "error"; message: string };
