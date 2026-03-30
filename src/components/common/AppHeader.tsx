import { Menu } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface Props {
  onMenuToggle: () => void;
}

export const AppHeader = ({ onMenuToggle }: Props) => {
  const { user } = useAuth();

  return (
    <header className="flex h-14 items-center gap-4 border-b border-border bg-card px-4 lg:px-6">
      <button onClick={onMenuToggle} className="lg:hidden rounded-lg p-1.5 text-foreground hover:bg-muted">
        <Menu className="h-5 w-5" />
      </button>
      <div className="flex-1" />
      <div className="text-sm text-muted-foreground">
        <span className="font-medium text-foreground">{user?.name}</span>
        {user?.role && (
          <span className="ml-2 rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
            {user.role}
          </span>
        )}
      </div>
    </header>
  );
};
