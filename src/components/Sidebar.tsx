import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import {
  Users,
  Package,
  CalendarDays,
  LayoutDashboard,
  LogOut,
  Wrench,
  FileText,
  Menu,
  X,
  Sun,
  Moon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";

const links = [
  { to: "/dashboard", label: "Inicio", icon: LayoutDashboard },
  { to: "/clients", label: "Clientes", icon: Users },
  { to: "/stock", label: "Stock", icon: Package },
  { to: "/invoices", label: "Facturas", icon: FileText },
  { to: "/tasks", label: "Agenda", icon: CalendarDays },
];

const Sidebar = () => {
  const { logout, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navContent = (
    <>
      <div className="flex items-center justify-between px-5 py-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary">
            <Wrench className="h-4 w-4 text-sidebar-primary-foreground" />
          </div>
          <span className="text-sm font-semibold text-sidebar-primary-foreground tracking-tight">
            Plumiks CRM
          </span>
        </div>
        <button
          onClick={() => setMobileOpen(false)}
          className="lg:hidden rounded-lg p-1.5 text-sidebar-foreground/70 hover:bg-sidebar-accent/50"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 space-y-1 px-3 pt-2">
        {links.map(({ to, label, icon: Icon }) => {
          const active = location.pathname.startsWith(to);
          return (
            <NavLink
              key={to}
              to={to}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border px-3 py-4 space-y-3">
        <div className="flex items-center justify-between px-3">
          <div className="flex items-center gap-2 text-xs font-medium text-sidebar-foreground/70">
            <Sun className="h-3.5 w-3.5" />
            <span>Tema</span>
            <Moon className="h-3.5 w-3.5" />
          </div>
          <Switch
            checked={theme === "dark"}
            onCheckedChange={toggleTheme}
            className="data-[state=checked]:bg-sidebar-primary data-[state=unchecked]:bg-sidebar-accent"
          />
        </div>
        <div className="mb-3 px-3">
          <p className="truncate text-xs font-medium text-sidebar-foreground">
            {user?.name}
          </p>
          <p className="truncate text-xs text-sidebar-foreground/50">
            {user?.email}
          </p>
        </div>
        <button
          onClick={() => {
            logout();
            setMobileOpen(false);
          }}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
        >
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile toggle button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-50 flex h-10 w-10 items-center justify-center rounded-lg bg-sidebar text-sidebar-foreground shadow-lg lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-sidebar text-sidebar-foreground transition-transform duration-300 lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {navContent}
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex h-screen w-56 flex-col bg-sidebar text-sidebar-foreground">
        {navContent}
      </aside>
    </>
  );
};

export default Sidebar;
