/**
 * Validation & formatting utilities
 */

// ── Validators ──────────────────────────────────────────

export const isValidEmail = (email: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

export const isValidPhone = (phone: string): boolean =>
  /^[+]?[\d\s\-()]{6,15}$/.test(phone.trim());

/** Validates Spanish NIF (8 digits + letter) or CIF (letter + 7 digits + letter/digit) */
export const isValidNif = (nif: string): boolean => {
  const cleaned = nif.trim().toUpperCase();
  if (!cleaned) return true; // optional field
  // NIF: 8 digits + letter
  if (/^\d{8}[A-Z]$/.test(cleaned)) return true;
  // NIE: X/Y/Z + 7 digits + letter
  if (/^[XYZ]\d{7}[A-Z]$/.test(cleaned)) return true;
  // CIF: letter + 8 chars
  if (/^[ABCDEFGHJKLMNPQRSUVW]\d{7}[\dA-J]$/.test(cleaned)) return true;
  return false;
};

export const isNonNegative = (value: number): boolean => value >= 0;

// ── Formatters ──────────────────────────────────────────

/** Format number with Spanish locale: 50000 → "50.000", 1234.5 → "1.234,5" */
export const formatNumber = (value: number, decimals?: number): string => {
  const opts: Intl.NumberFormatOptions = {};
  if (decimals !== undefined) {
    opts.minimumFractionDigits = decimals;
    opts.maximumFractionDigits = decimals;
  }
  return new Intl.NumberFormat("es-ES", opts).format(value);
};

/** Format currency with € */
export const formatCurrency = (value: number): string =>
  formatNumber(value, 2) + " €";

// ── Form-level validation helpers ───────────────────────

export interface ValidationError {
  field: string;
  message: string;
}

export const validateClientForm = (form: {
  name: string;
  phone: string;
  email: string;
}): ValidationError[] => {
  const errors: ValidationError[] = [];
  if (!form.name.trim()) errors.push({ field: "name", message: "El nombre es obligatorio" });
  if (form.phone && !isValidPhone(form.phone))
    errors.push({ field: "phone", message: "Teléfono no válido (6-15 dígitos)" });
  if (form.email && !isValidEmail(form.email))
    errors.push({ field: "email", message: "Email no válido" });
  return errors;
};

export const validateStockForm = (form: {
  name: string;
  category: string;
  unit: string;
  quantity: number;
  price: number;
  minStock: number;
}): ValidationError[] => {
  const errors: ValidationError[] = [];
  if (!form.name.trim()) errors.push({ field: "name", message: "Nombre requerido" });
  if (!form.category.trim()) errors.push({ field: "category", message: "Categoría requerida" });
  if (!form.unit.trim()) errors.push({ field: "unit", message: "Unidad requerida" });
  if (form.quantity < 0) errors.push({ field: "quantity", message: "La cantidad no puede ser negativa" });
  if (form.price < 0) errors.push({ field: "price", message: "El precio no puede ser negativo" });
  if (form.minStock < 0) errors.push({ field: "minStock", message: "El stock mínimo no puede ser negativo" });
  return errors;
};

export const validateInvoiceForm = (form: {
  clientId: string;
  clientNif: string;
  issuerNif: string;
  lines: { description: string; quantity: number; price: number; taxRate: number }[];
}): ValidationError[] => {
  const errors: ValidationError[] = [];
  if (!form.clientId) errors.push({ field: "clientId", message: "Selecciona un cliente" });
  if (form.clientNif && !isValidNif(form.clientNif))
    errors.push({ field: "clientNif", message: "NIF/CIF del cliente no válido" });
  if (form.issuerNif && !isValidNif(form.issuerNif))
    errors.push({ field: "issuerNif", message: "NIF/CIF del emisor no válido" });
  if (!form.lines.some((l) => l.description.trim()))
    errors.push({ field: "lines", message: "Añade al menos un concepto" });
  form.lines.forEach((l, i) => {
    if (l.quantity < 0) errors.push({ field: `line_${i}_qty`, message: `Línea ${i + 1}: cantidad negativa` });
    if (l.price < 0) errors.push({ field: `line_${i}_price`, message: `Línea ${i + 1}: precio negativo` });
    if (l.taxRate < 0) errors.push({ field: `line_${i}_tax`, message: `Línea ${i + 1}: IVA negativo` });
  });
  return errors;
};

export const validateTaskForm = (form: {
  description?: string;
  date?: string;
  time?: string;
}): ValidationError[] => {
  const errors: ValidationError[] = [];
  if (!form.description?.trim()) errors.push({ field: "description", message: "La descripción es obligatoria" });
  if (!form.date) errors.push({ field: "date", message: "La fecha es obligatoria" });
  if (!form.time) errors.push({ field: "time", message: "La hora es obligatoria" });
  return errors;
};
