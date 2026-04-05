export function validateKenyaPhone(phone: string): { valid: boolean; error?: string } {
  if (!phone || phone.trim() === "") return { valid: true }; // optional field

  const cleaned = phone.replace(/\s/g, "");

  // Kenya: +254XXXXXXXXX, 254XXXXXXXXX, 07XXXXXXXX, 01XXXXXXXX
  const kenyanRegex = /^(\+?254|0)(7|1)\d{8}$/;

  if (!kenyanRegex.test(cleaned)) {
    return {
      valid: false,
      error: "Enter a valid Kenyan phone number (e.g., +254712345678 or 0712345678)",
    };
  }

  return { valid: true };
}

export function sanitizePhone(phone: string): string {
  return phone.replace(/[^\d+]/g, "");
}
