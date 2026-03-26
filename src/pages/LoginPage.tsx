import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { motion } from "framer-motion";
import { Wrench, Sun, Moon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const LoginPage = () => {
  const { login, register } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isRegister, setIsRegister] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // ✅ Campos nuevos del autónomo
  const [issuerAddress, setIssuerAddress] = useState("");
  const [issuerNif, setIssuerNif] = useState("");
  const [issuerEmail, setIssuerEmail] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Introduce email y contraseña");
      return;
    }

    if (isRegister) {
      if (!name.trim()) return setError("Introduce tu nombre");

      if (!issuerAddress.trim())
        return setError("Introduce tu dirección fiscal");

      if (!issuerNif.trim()) return setError("Introduce tu NIF/CIF");

      if (password !== confirmPassword)
        return setError("Las contraseñas no coinciden");

      if (password.length < 6)
        return setError("La contraseña debe tener al menos 6 caracteres");

      setLoading(true);

      const success = await register({
        name,
        email,
        password,
        issuerAddress,
        issuerNif,
        issuerEmail: issuerEmail.trim() || email, // fallback
      });

      setLoading(false);

      if (!success) setError("Error al registrarse. Intenta de nuevo.");
      return;
    }

    // ✅ LOGIN
    setLoading(true);
    const success = await login(email, password);
    setLoading(false);

    if (!success) setError("Credenciales incorrectas");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 relative">
      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        className="absolute top-5 right-5 flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Cambiar tema"
      >
        {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </button>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-sm"
      >
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
            <Wrench className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            FontaneroCRM
          </h1>
          <p className="text-sm text-muted-foreground">
            {isRegister
              ? "Crea tu cuenta para gestionar tu negocio"
              : "Gestiona tu negocio de fontanería"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* ✅ Campo nombre SOLO en registro */}
          {isRegister && (
            <div className="space-y-2">
              <Label htmlFor="name">Nombre completo</Label>
              <Input
                id="name"
                type="text"
                placeholder="Tu nombre"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* ✅ Campos nuevos SOLO en registro */}
          {isRegister && (
            <>
              <div className="space-y-2">
                <Label htmlFor="issuerAddress">Dirección fiscal *</Label>
                <Input
                  id="issuerAddress"
                  type="text"
                  placeholder="Calle, número, ciudad..."
                  value={issuerAddress}
                  onChange={(e) => setIssuerAddress(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="issuerNif">NIF / CIF *</Label>
                <Input
                  id="issuerNif"
                  type="text"
                  placeholder="12345678X"
                  value={issuerNif}
                  onChange={(e) => setIssuerNif(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="issuerEmail">Email fiscal (opcional)</Label>
                <Input
                  id="issuerEmail"
                  type="email"
                  placeholder="facturacion@tudominio.com"
                  value={issuerEmail}
                  onChange={(e) => setIssuerEmail(e.target.value)}
                />
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {isRegister && (
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading
              ? isRegister
                ? "Registrando..."
                : "Iniciando..."
              : isRegister
                ? "Crear cuenta"
                : "Iniciar sesión"}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setError("");
            }}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {isRegister
              ? "¿Ya tienes cuenta? Inicia sesión"
              : "¿No tienes cuenta? Regístrate"}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
