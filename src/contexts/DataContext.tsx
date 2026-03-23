import { createContext, useContext, useState, ReactNode } from "react";
import {
  Cliente,
  StockItem,
  Tarea,
  mockClientes as initialClientes,
  mockStock as initialStock,
  mockTareas as initialTareas,
} from "@/data/mockData";

interface DataContextType {
  clientes: Cliente[];
  stock: StockItem[];
  tareas: Tarea[];
  addCliente: (c: Omit<Cliente, "id">) => void;
  updateCliente: (c: Cliente) => void;
  deleteCliente: (id: string) => void;
  addStockItem: (s: Omit<StockItem, "id">) => void;
  updateStockItem: (s: StockItem) => void;
  deleteStockItem: (id: string) => void;
  addTarea: (t: Omit<Tarea, "id">) => void;
  updateTarea: (t: Tarea) => void;
  deleteTarea: (id: string) => void;
  updateTareaEstado: (id: string, estado: Tarea["estado"]) => void;
}

const DataContext = createContext<DataContextType | null>(null);

let nextId = 100;
const genId = () => String(++nextId);

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const [clientes, setClientes] = useState<Cliente[]>([...initialClientes]);
  const [stock, setStock] = useState<StockItem[]>([...initialStock]);
  const [tareas, setTareas] = useState<Tarea[]>([...initialTareas]);

  const addCliente = (c: Omit<Cliente, "id">) =>
    setClientes((prev) => [...prev, { ...c, id: genId() }]);
  const updateCliente = (c: Cliente) =>
    setClientes((prev) => prev.map((x) => (x.id === c.id ? c : x)));
  const deleteCliente = (id: string) =>
    setClientes((prev) => prev.filter((x) => x.id !== id));

  const addStockItem = (s: Omit<StockItem, "id">) =>
    setStock((prev) => [...prev, { ...s, id: genId() }]);
  const updateStockItem = (s: StockItem) =>
    setStock((prev) => prev.map((x) => (x.id === s.id ? s : x)));
  const deleteStockItem = (id: string) =>
    setStock((prev) => prev.filter((x) => x.id !== id));

  const addTarea = (t: Omit<Tarea, "id">) =>
    setTareas((prev) => [...prev, { ...t, id: genId() }]);
  const updateTarea = (t: Tarea) =>
    setTareas((prev) => prev.map((x) => (x.id === t.id ? t : x)));
  const deleteTarea = (id: string) =>
    setTareas((prev) => prev.filter((x) => x.id !== id));
  const updateTareaEstado = (id: string, estado: Tarea["estado"]) =>
    setTareas((prev) =>
      prev.map((x) => (x.id === id ? { ...x, estado } : x))
    );

  return (
    <DataContext.Provider
      value={{
        clientes, stock, tareas,
        addCliente, updateCliente, deleteCliente,
        addStockItem, updateStockItem, deleteStockItem,
        addTarea, updateTarea, deleteTarea, updateTareaEstado,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
};
