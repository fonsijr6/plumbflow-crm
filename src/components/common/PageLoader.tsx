import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  className?: string;
  text?: string;
}

export const PageLoader = ({ className, text }: Props) => (
  <div className={cn("flex flex-col items-center justify-center py-20 gap-3", className)}>
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
    {text && <p className="text-sm text-muted-foreground">{text}</p>}
  </div>
);
