import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { useTheme } from "@/contexts/ThemeContext";
import {
  LayoutDashboard, Users, Package, FileText, CalendarDays, Receipt,
  ClipboardList, LogOut, X, Sun, Moon, UserCircle, Warehouse, Droplets,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";

interface NavItem {
  to: string;
  label: string;
  icon: React.ElementType;
  module?: string;
  action?: string;
  roles?: string[];
}

const navItems: NavItem[] = [
  { to: "/dashboard", label: "Inicio", icon: LayoutDashboard },
  { to: "/clients", label: "Clientes", icon: Users, module: "clients", action: "view" },
  { to: "/tasks", label: "Avisos", icon: CalendarDays, module: "tasks", action: "view" },
  { to: "/products", label: "Productos", icon: Package, module: "products", action: "view" },
  { to: "/stock", label: "Stock", icon: Warehouse, module: "products", action: "view" },
  { to: "/invoices", label: "Facturas", icon: FileText, module: "invoices", action: "view" },
  { to: "/quotes", label: "Presupuestos", icon: Receipt, module: "quotes", action: "view" },
  { to: "/employees", label: "Empleados", icon: Users, module: "users", action: "view", roles: ["owner", "admin"] },
  { to: "/audit", label: "Auditoría", icon: ClipboardList, roles: ["owner", "admin"] },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

export const AppSidebar = ({ open, onClose }: Props) => {
  const { logout, user } = useAuth();
  const { hasPermission, hasRole } = usePermissions();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const visibleItems = navItems.filter((item) => {
    if (item.roles && !item.roles.some((r) => hasRole(r))) return false;
    if (item.module && item.action && !hasPermission(item.module, item.action)) return false;
    return true;
  });

  const nav = (
    <>
      <div className="flex items-center justify-between px-5 py-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary">
            <Droplets className="h-4 w-4 text-sidebar-primary-foreground" />
          </div>
          <span className="text-sm font-semibold text-sidebar-primary-foreground tracking-tight">
            Plumiks CRM
          </span>
        </div>
        <button onClick={onClose} className="lg:hidden rounded-lg p-1.5 text-sidebar-foreground/70 hover:bg-sidebar-accent/50">
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 space-y-0.5 px-3 overflow-y-auto">
        {visibleItems.map(({ to, label, icon: Icon }) => {
          const active = location.pathname.startsWith(to);
          return (
            <NavLink key={to} to={to} onClick={onClose}
              className={cn(
                "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150",
                active
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm shadow-sidebar-primary/25"
                  : "text-sidebar-foreground/65 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
              )}>
              <Icon className="h-4 w-4" />{label}
            </NavLink>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border px-3 py-4 space-y-3">
        <div className="flex items-center justify-between px-3">
          <div className="flex items-center gap-2 text-xs font-medium text-sidebar-foreground/60">
            <Sun className="h-3.5 w-3.5" /><span>Tema</span><Moon className="h-3.5 w-3.5" />
          </div>
          <Switch checked={theme === "dark"} onCheckedChange={toggleTheme}
            className="data-[state=checked]:bg-sidebar-primary data-[state=unchecked]:bg-sidebar-accent" />
        </div>

        <div
          className="px-3 cursor-pointer hover:bg-sidebar-accent/50 rounded-xl py-2 transition-colors"
          onClick={() => { navigate("/profile"); onClose(); }}
        >
          <div className="flex items-center gap-2.5">
            <UserCircle className="h-5 w-5 text-sidebar-foreground/45" />
            <div className="truncate">
              <p className="truncate text-xs font-medium text-sidebar-foreground">{user?.name}</p>
              <p className="truncate text-xs text-sidebar-foreground/45">{user?.email}</p>
            </div>
          </div>
        </div>

        <button onClick={() => { logout(); onClose(); }}
          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-sidebar-foreground/60 transition-colors hover:bg-destructive/10 hover:text-destructive">
          <LogOut className="h-4 w-4" />Cerrar sesión
        </button>
      </div>
    </>
  );

  return (
    <>
      {open && <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden" onClick={onClose} />}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-sidebar text-sidebar-foreground transition-transform duration-300 lg:hidden",
        open ? "translate-x-0" : "-translate-x-full"
      )}>
        {nav}
      </aside>
      <aside className="hidden lg:flex h-screen w-60 flex-shrink-0 flex-col bg-sidebar text-sidebar-foreground">
        {nav}
      </aside>
    </>
  );
};
