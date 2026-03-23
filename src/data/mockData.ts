export interface Cliente {
  id: string;
  nombre: string;
  telefono: string;
  email: string;
  direccion: string;
  notas: string;
  fechaAlta: string;
}

export interface StockItem {
  id: string;
  nombre: string;
  categoria: string;
  cantidad: number;
  unidad: string;
  precioUnitario: number;
  stockMinimo: number;
}

export interface Tarea {
  id: string;
  clienteId: string;
  clienteNombre: string;
  direccion: string;
  descripcion: string;
  fecha: string; // YYYY-MM-DD
  hora: string;
  estado: "pendiente" | "en_progreso" | "completada";
}

export const mockClientes: Cliente[] = [
  { id: "1", nombre: "María García López", telefono: "612 345 678", email: "maria.garcia@email.com", direccion: "Calle Mayor 12, 3ºB, Madrid", notas: "Problemas recurrentes con caldera", fechaAlta: "2024-01-15" },
  { id: "2", nombre: "Carlos Ruiz Fernández", telefono: "634 567 890", email: "carlos.ruiz@email.com", direccion: "Av. de la Constitución 45, Valencia", notas: "Comunidad de vecinos - presidente", fechaAlta: "2024-02-20" },
  { id: "3", nombre: "Ana Martínez Soto", telefono: "655 123 456", email: "ana.martinez@email.com", direccion: "Plaza España 8, 1ºA, Sevilla", notas: "", fechaAlta: "2024-03-10" },
  { id: "4", nombre: "Pedro Jiménez Navarro", telefono: "678 901 234", email: "pedro.jimenez@email.com", direccion: "Calle del Prado 22, Barcelona", notas: "Reforma completa baño programada", fechaAlta: "2024-04-05" },
  { id: "5", nombre: "Laura Sánchez Díaz", telefono: "691 234 567", email: "laura.sanchez@email.com", direccion: "Ronda de Toledo 5, 2ºC, Zaragoza", notas: "Tubería antigua, revisar en próxima visita", fechaAlta: "2024-05-12" },
  { id: "6", nombre: "Javier Moreno Ruiz", telefono: "623 456 789", email: "javier.moreno@email.com", direccion: "Calle Alcalá 88, Madrid", notas: "", fechaAlta: "2024-06-01" },
];

export const mockStock: StockItem[] = [
  { id: "1", nombre: "Tubo PVC 40mm", categoria: "Tubería", cantidad: 25, unidad: "metros", precioUnitario: 3.50, stockMinimo: 10 },
  { id: "2", nombre: "Tubo cobre 22mm", categoria: "Tubería", cantidad: 15, unidad: "metros", precioUnitario: 8.20, stockMinimo: 5 },
  { id: "3", nombre: "Grifo monomando cocina", categoria: "Grifería", cantidad: 4, unidad: "uds", precioUnitario: 45.00, stockMinimo: 2 },
  { id: "4", nombre: "Sifón botella 1 1/4\"", categoria: "Accesorios", cantidad: 8, unidad: "uds", precioUnitario: 6.50, stockMinimo: 3 },
  { id: "5", nombre: "Cinta de teflón", categoria: "Sellado", cantidad: 20, unidad: "uds", precioUnitario: 1.20, stockMinimo: 10 },
  { id: "6", nombre: "Silicona sanitaria blanca", categoria: "Sellado", cantidad: 6, unidad: "uds", precioUnitario: 5.80, stockMinimo: 3 },
  { id: "7", nombre: "Válvula de esfera 1/2\"", categoria: "Válvulas", cantidad: 12, unidad: "uds", precioUnitario: 7.90, stockMinimo: 5 },
  { id: "8", nombre: "Termo eléctrico 80L", categoria: "Calentadores", cantidad: 2, unidad: "uds", precioUnitario: 189.00, stockMinimo: 1 },
  { id: "9", nombre: "Flexo ducha 1.5m", categoria: "Accesorios", cantidad: 7, unidad: "uds", precioUnitario: 9.50, stockMinimo: 3 },
  { id: "10", nombre: "Junta tórica surtido", categoria: "Sellado", cantidad: 3, unidad: "packs", precioUnitario: 12.00, stockMinimo: 2 },
];

const today = new Date();
const fmt = (d: Date) => d.toISOString().split("T")[0];
const addDays = (d: Date, n: number) => { const r = new Date(d); r.setDate(r.getDate() + n); return r; };

export const mockTareas: Tarea[] = [
  { id: "1", clienteId: "1", clienteNombre: "María García", direccion: "Calle Mayor 12, 3ºB", descripcion: "Revisión caldera y purga radiadores", fecha: fmt(today), hora: "09:00", estado: "pendiente" },
  { id: "2", clienteId: "3", clienteNombre: "Ana Martínez", direccion: "Plaza España 8, 1ºA", descripcion: "Cambio grifo baño", fecha: fmt(today), hora: "11:30", estado: "pendiente" },
  { id: "3", clienteId: "5", clienteNombre: "Laura Sánchez", direccion: "Ronda de Toledo 5, 2ºC", descripcion: "Desatasco fregadero cocina", fecha: fmt(today), hora: "16:00", estado: "en_progreso" },
  { id: "4", clienteId: "2", clienteNombre: "Carlos Ruiz", direccion: "Av. de la Constitución 45", descripcion: "Instalación contador comunitario", fecha: fmt(addDays(today, 1)), hora: "10:00", estado: "pendiente" },
  { id: "5", clienteId: "4", clienteNombre: "Pedro Jiménez", direccion: "Calle del Prado 22", descripcion: "Inicio reforma baño completa", fecha: fmt(addDays(today, 1)), hora: "08:30", estado: "pendiente" },
  { id: "6", clienteId: "6", clienteNombre: "Javier Moreno", direccion: "Calle Alcalá 88", descripcion: "Reparación cisterna WC", fecha: fmt(addDays(today, 2)), hora: "09:30", estado: "pendiente" },
  { id: "7", clienteId: "1", clienteNombre: "María García", direccion: "Calle Mayor 12, 3ºB", descripcion: "Seguimiento caldera", fecha: fmt(addDays(today, 3)), hora: "10:00", estado: "pendiente" },
];
