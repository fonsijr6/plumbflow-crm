export interface Client {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
  createdAt: string;
}

export interface StockItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  minStock: number;
  images?: string[];
}

export interface Task {
  id: string;
  clientId: string;
  clientName: string;
  address: string;
  description: string;
  date: string;
  time: string;
  status: "pending" | "in_progress" | "completed";
}

export interface InvoiceLine {
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number; // e.g. 21 for 21%
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  clientName: string;
  clientEmail?: string;
  clientAddress: string;
  clientNif: string;
  issuerName: string;
  issuerEmail?: string;
  issuerNif: string;
  issuerAddress: string;
  date: string;
  dueDate: string;
  lines: InvoiceLine[];
  notes: string;
  status: "draft" | "sent" | "paid" | "overdue";
  subtotal: number;
  taxTotal: number;
  total: number;
}

export const mockClients: Client[] = [
  {
    id: "1",
    name: "Juan Pérez",
    phone: "600123456",
    email: "juan@ejemplo.com",
    address: "Calle Falsa 123, Madrid",
    notes: "Cliente habitual, prefiere contacto por WhatsApp.",
    createdAt: "2023-10-01",
  },
  {
    id: "2",
    name: "María García",
    phone: "600987654",
    email: "maria@ejemplo.com",
    address: "Av. Principal 45, Madrid",
    notes: "Instalación de caldera pendiente.",
    createdAt: "2023-11-15",
  },
];

export const mockStock: StockItem[] = [
  {
    id: "1",
    name: "Tubo PVC 40mm",
    category: "Tuberías",
    quantity: 15,
    unit: "metros",
    unitPrice: 2.5,
    minStock: 5,
  },
  {
    id: "2",
    name: "Codo 90º 40mm",
    category: "Accesorios",
    quantity: 3,
    unit: "unidades",
    unitPrice: 1.2,
    minStock: 10,
  },
];

export const mockTasks: Task[] = [
  {
    id: "1",
    clientId: "1",
    clientName: "Juan Pérez",
    address: "Calle Falsa 123, Madrid",
    description: "Reparación de fuga en baño",
    date: new Date().toISOString().split("T")[0],
    time: "10:00",
    status: "pending",
  },
];
