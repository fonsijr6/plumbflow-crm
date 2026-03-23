import { createContext, useContext, useState, ReactNode } from "react";
import {
  Client,
  StockItem,
  Task,
  mockClients as initialClients,
  mockStock as initialStock,
  mockTasks as initialTasks,
} from "@/data/mockData";

interface DataContextType {
  clients: Client[];
  stock: StockItem[];
  tasks: Task[];
  addClient: (c: Omit<Client, "id">) => void;
  updateClient: (c: Client) => void;
  deleteClient: (id: string) => void;
  addStockItem: (s: Omit<StockItem, "id">) => void;
  updateStockItem: (s: StockItem) => void;
  deleteStockItem: (id: string) => void;
  addTask: (t: Omit<Task, "id">) => void;
  updateTask: (t: Task) => void;
  deleteTask: (id: string) => void;
  updateTaskStatus: (id: string, status: Task["status"]) => void;
}

const DataContext = createContext<DataContextType | null>(null);

let nextId = 100;
const genId = () => String(++nextId);

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const [clients, setClients] = useState<Client[]>([...initialClients]);
  const [stock, setStock] = useState<StockItem[]>([...initialStock]);
  const [tasks, setTasks] = useState<Task[]>([...initialTasks]);

  // --- Clients ---
  const addClient = (c: Omit<Client, "id">) =>
    setClients((prev) => [...prev, { ...c, id: genId() }]);
  const updateClient = (c: Client) =>
    setClients((prev) => prev.map((x) => (x.id === c.id ? c : x)));
  const deleteClient = (id: string) =>
    setClients((prev) => prev.filter((x) => x.id !== id));

  // --- Stock ---
  const addStockItem = (s: Omit<StockItem, "id">) =>
    setStock((prev) => [...prev, { ...s, id: genId() }]);
  const updateStockItem = (s: StockItem) =>
    setStock((prev) => prev.map((x) => (x.id === s.id ? s : x)));
  const deleteStockItem = (id: string) =>
    setStock((prev) => prev.filter((x) => x.id !== id));

  // --- Tasks ---
  const addTask = (t: Omit<Task, "id">) =>
    setTasks((prev) => [...prev, { ...t, id: genId() }]);
  const updateTask = (t: Task) =>
    setTasks((prev) => prev.map((x) => (x.id === t.id ? t : x)));
  const deleteTask = (id: string) =>
    setTasks((prev) => prev.filter((x) => x.id !== id));
  const updateTaskStatus = (id: string, status: Task["status"]) =>
    setTasks((prev) => prev.map((x) => (x.id === id ? { ...x, status } : x)));

  return (
    <DataContext.Provider
      value={{
        clients,
        stock,
        tasks,
        addClient,
        updateClient,
        deleteClient,
        addStockItem,
        updateStockItem,
        deleteStockItem,
        addTask,
        updateTask,
        deleteTask,
        updateTaskStatus,
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
