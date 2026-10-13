import type { InquiryContact, InquiryErrors } from "./types";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_PATTERN = /^[+()\d\s-]{7,20}$/;

export const NOTES_MAX_LENGTH = 2000;

export const emptyContact: InquiryContact = {
  fullName: "",
  email: "",
  phone: "",
  company: "",
  notes: "",
  consent: false,
};

export function validateContact(contact: InquiryContact): InquiryErrors {
  const errors: InquiryErrors = {};
  if (contact.fullName.trim().length < 3) errors.fullName = "Podaj imię i nazwisko.";
  if (!EMAIL_PATTERN.test(contact.email.trim())) errors.email = "Podaj poprawny adres e-mail.";
  if (contact.phone.trim() && !PHONE_PATTERN.test(contact.phone.trim())) errors.phone = "Numer telefonu wygląda na niepoprawny.";
  if (contact.notes.length > NOTES_MAX_LENGTH) errors.notes = `Uwagi mogą mieć maksymalnie ${NOTES_MAX_LENGTH} znaków.`;
  if (!contact.consent) errors.consent = "Zgoda jest wymagana, abyśmy mogli przygotować wycenę.";
  return errors;
}
