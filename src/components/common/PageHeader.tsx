import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Props {
  title: string;
  subtitle?: string;
  backTo?: string;
  backLabel?: string;
  actions?: React.ReactNode;
}

export const PageHeader = ({ title, subtitle, backTo, backLabel, actions }: Props) => {
  const navigate = useNavigate();
  return (
    <div className="mb-6">
      {backTo && (
        <button
          onClick={() => navigate(backTo)}
          className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {backLabel || "Volver"}
        </button>
      )}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
};
