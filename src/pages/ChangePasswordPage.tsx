import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { authApi } from "@/api/authApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const ChangePasswordPage = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const isValid = currentPassword.length > 0 && newPassword.length >= 6 && newPassword === confirm;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    setLoading(true);
    try {
      await authApi.changePassword({ currentPassword, newPassword });
      toast.success("Contraseña actualizada");
      navigate("/dashboard", { replace: true });
    } catch {
      toast.error("Error al cambiar la contraseña");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Cambiar contraseña</CardTitle>
          <CardDescription>Debes cambiar tu contraseña para continuar</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Contraseña actual</Label>
              <Input type="password" maxLength={50} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Nueva contraseña</Label>
              <Input type="password" maxLength={50} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Confirmar contraseña</Label>
              <Input type="password" maxLength={50} value={confirm} onChange={(e) => setConfirm(e.target.value)} />
              {confirm && newPassword !== confirm && <p className="text-xs text-destructive">Las contraseñas no coinciden</p>}
            </div>
            <Button type="submit" className="w-full" disabled={!isValid || loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Cambiar contraseña
            </Button>
            <Button type="button" variant="ghost" className="w-full" onClick={logout}>
              Cerrar sesión
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChangePasswordPage;
