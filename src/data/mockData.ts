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

export const mockClients: Client[] = [
  {
    id: "1",
    name: "María García López",
    phone: "612 345 678",
    email: "maria.garcia@email.com",
    address: "Calle Mayor 12, 3ºB, Madrid",
    notes: "Recurring boiler issues",
    createdAt: "2024-01-15",
  },
  {
    id: "2",
    name: "Carlos Ruiz Fernández",
    phone: "634 567 890",
    email: "carlos.ruiz@email.com",
    address: "Av. de la Constitución 45, Valencia",
    notes: "Building manager / HOA president",
    createdAt: "2024-02-20",
  },
  {
    id: "3",
    name: "Ana Martínez Soto",
    phone: "655 123 456",
    email: "ana.martinez@email.com",
    address: "Plaza España 8, 1ºA, Sevilla",
    notes: "",
    createdAt: "2024-03-10",
  },
  {
    id: "4",
    name: "Pedro Jiménez Navarro",
    phone: "678 901 234",
    email: "pedro.jimenez@email.com",
    address: "Calle del Prado 22, Barcelona",
    notes: "Full bathroom renovation scheduled",
    createdAt: "2024-04-05",
  },
  {
    id: "5",
    name: "Laura Sánchez Díaz",
    phone: "691 234 567",
    email: "laura.sanchez@email.com",
    address: "Ronda de Toledo 5, 2ºC, Zaragoza",
    notes: "Old pipes, check on next visit",
    createdAt: "2024-05-12",
  },
  {
    id: "6",
    name: "Javier Moreno Ruiz",
    phone: "623 456 789",
    email: "javier.moreno@email.com",
    address: "Calle Alcalá 88, Madrid",
    notes: "",
    createdAt: "2024-06-01",
  },
];

export const mockStock: StockItem[] = [
  {
    id: "1",
    name: "PVC pipe 40mm",
    category: "Piping",
    quantity: 25,
    unit: "meters",
    unitPrice: 3.5,
    minStock: 10,
  },
  {
    id: "2",
    name: "Copper pipe 22mm",
    category: "Piping",
    quantity: 15,
    unit: "meters",
    unitPrice: 8.2,
    minStock: 5,
  },
  {
    id: "3",
    name: "Kitchen mixer tap",
    category: "Faucets",
    quantity: 4,
    unit: "units",
    unitPrice: 45.0,
    minStock: 2,
  },
  {
    id: "4",
    name: 'Bottle trap 1 1/4"',
    category: "Accessories",
    quantity: 8,
    unit: "units",
    unitPrice: 6.5,
    minStock: 3,
  },
  {
    id: "5",
    name: "Teflon tape",
    category: "Sealing",
    quantity: 20,
    unit: "units",
    unitPrice: 1.2,
    minStock: 10,
  },
  {
    id: "6",
    name: "White sanitary silicone",
    category: "Sealing",
    quantity: 6,
    unit: "units",
    unitPrice: 5.8,
    minStock: 3,
  },
  {
    id: "7",
    name: 'Ball valve 1/2"',
    category: "Valves",
    quantity: 12,
    unit: "units",
    unitPrice: 7.9,
    minStock: 5,
  },
  {
    id: "8",
    name: "Electric water heater 80L",
    category: "Heaters",
    quantity: 2,
    unit: "units",
    unitPrice: 189.0,
    minStock: 1,
  },
  {
    id: "9",
    name: "Shower hose 1.5m",
    category: "Accessories",
    quantity: 7,
    unit: "units",
    unitPrice: 9.5,
    minStock: 3,
  },
  {
    id: "10",
    name: "O-ring assortment",
    category: "Sealing",
    quantity: 3,
    unit: "packs",
    unitPrice: 12.0,
    minStock: 2,
  },
];

export const mockTasks: Task[] = [
  {
    id: "1",
    clientId: "1",
    clientName: "María García López",
    address: "Calle Mayor 12, 3ºB, Madrid",
    description: "Boiler maintenance",
    date: "2024-03-25",
    time: "09:00",
    status: "pending",
  },
  {
    id: "2",
    clientId: "2",
    clientName: "Carlos Ruiz Fernández",
    address: "Av. de la Constitución 45, Valencia",
    description: "Check building water pumps",
    date: "2024-03-25",
    time: "11:30",
    status: "in_progress",
  },
  {
    id: "3",
    clientId: "4",
    clientName: "Pedro Jiménez Navarro",
    address: "Calle del Prado 22, Barcelona",
    description: "Bathroom renovation supervision",
    date: "2024-03-26",
    time: "10:00",
    status: "pending",
  },
  {
    id: "4",
    clientId: "5",
    clientName: "Laura Sánchez Díaz",
    address: "Ronda de Toledo 5, 2ºC, Zaragoza",
    description: "Pipe inspection",
    date: "2024-03-26",
    time: "14:00",
    status: "completed",
  },
  {
    id: "5",
    clientId: "6",
    clientName: "Javier Moreno Ruiz",
    address: "Calle Alcalá 88, Madrid",
    description: "General plumbing check",
    date: "2024-03-27",
    time: "08:30",
    status: "pending",
  },
];
