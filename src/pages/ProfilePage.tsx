import { useAuth } from "@/contexts/AuthContext";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserCircle } from "lucide-react";

const ProfilePage = () => {
  const { user } = useAuth();

  return (
    <div>
      <PageHeader title="Mi perfil" backTo="/dashboard" backLabel="Volver a inicio" />

      <Card className="max-w-lg">
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <UserCircle className="h-10 w-10 text-muted-foreground" />
            </div>
            <div>
              <CardTitle>{user?.name}</CardTitle>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div><span className="text-muted-foreground">Rol:</span> <span className="ml-1 capitalize">{user?.role}</span></div>
          <div><span className="text-muted-foreground">ID Empresa:</span> <span className="ml-1 font-mono text-xs">{user?.companyId}</span></div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfilePage;
