/* eslint-disable @typescript-eslint/no-explicit-any */
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getTask, updateTask, deleteTask } from "@/api/TaskApi";

import {
  Clock,
  Calendar,
  MapPin,
  ChevronLeft,
  Pencil,
  Trash2,
  Camera,
  X,
} from "lucide-react";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { useState, useRef } from "react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";

import { uploadImageToCloudinary } from "@/utils/uploadImage";

const estadoColor = {
  pending: "bg-warning/15 text-warning-foreground border-warning/30",
  in_progress: "bg-primary/10 text-primary border-primary/30",
  completed: "bg-success/15 text-success border-success/30",
};

const estadoLabel = {
  pending: "Pendiente",
  in_progress: "En progreso",
  completed: "Completada",
};

const TaskDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [taskForm, setTaskForm] = useState<any>({});
  const [editOpen, setEditOpen] = useState(false);

  /* ✅ FETCH TASK */
  const { data: task, isLoading } = useQuery({
    queryKey: ["task", id],
    queryFn: () => getTask(id!),
  });

  /* ✅ UPDATE TASK */
  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) =>
      updateTask(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task", id] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Tarea actualizada");
      setEditOpen(false);
    },
  });

  /* ✅ DELETE TASK */
  const deleteMutation = useMutation({
    mutationFn: deleteTask,
    onSuccess: () => {
      toast.success("Tarea eliminada");
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      navigate("/tasks");
    },
  });

  /* ✅ Abrir modal de edición */
  const openEditTask = () => {
    setTaskForm({
      description: task.description,
      date: task.date,
      time: task.time,
      address: task.address,
      status: task.status,
      images: task.images || [],
    });

    setEditOpen(true);
  };

  /* ✅ Guardar cambios */
  const saveTask = () => {
    if (!taskForm.description.trim()) {
      toast.error("La descripción es obligatoria");
      return;
    }

    updateMutation.mutate({
      id: task.id,
      payload: taskForm,
    });
  };

  /* ✅ Fotos → Cloudinary */
  const handleAddPhotos = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (files: FileList | null) => {
    if (!files || !task) return;

    const urls = await Promise.all(
      Array.from(files).map((file) => uploadImageToCloudinary(file)),
    );

    updateMutation.mutate({
      id: task.id,
      payload: { images: [...(task.images || []), ...urls] },
    });
  };

  /* ✅ Quitar foto dentro del modal */
  const removePhoto = (index: number) => {
    setTaskForm((prev: any) => ({
      ...prev,
      images: prev.images.filter((_: any, i: number) => i !== index),
    }));
  };

  /* ✅ Cambiar estado */
  const handleEstado = () => {
    const next =
      task.status === "pending"
        ? "in_progress"
        : task.status === "in_progress"
          ? "completed"
          : "completed";

    updateMutation.mutate({
      id: task.id,
      payload: { status: next },
    });
  };

  if (isLoading || !task) {
    return (
      <p className="py-12 text-center text-muted-foreground">Cargando tarea…</p>
    );
  }

  return (
    <div className="space-y-6">
      {/* ✅ HEADER */}
      <div className="sticky top-0 bg-background border-b pb-3 pt-2 z-20">
        <button
          onClick={() => navigate("/tasks")}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" /> Volver a avisos
        </button>

        <div className="flex justify-between items-center mt-3">
          <div>
            <h1 className="text-2xl font-semibold">{task.description}</h1>
            <p className="text-sm text-muted-foreground">{task.clientName}</p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={openEditTask}>
              <Pencil className="h-4 w-4 mr-1" /> Editar
            </Button>

            <Button
              variant="destructive"
              size="sm"
              onClick={() => deleteMutation.mutate(task.id)}
            >
              <Trash2 className="h-4 w-4 mr-1" /> Eliminar
            </Button>
          </div>
        </div>
      </div>

      {/* ✅ Información */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Información</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            {task.time}
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            {new Date(task.date).toLocaleDateString("es-ES")}
          </div>

          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            {task.address}
          </div>

          <Badge variant="outline" className={estadoColor[task.status]}>
            {estadoLabel[task.status]}
          </Badge>

          <div className="flex gap-2 pt-2">
            {task.status !== "completed" && (
              <Button size="sm" onClick={handleEstado}>
                {task.status === "pending"
                  ? "Iniciar tarea"
                  : "Finalizar tarea"}
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/clients/${task.clientId}`)}
            >
              Ver cliente
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ✅ Fotos */}
      <Card>
        <CardHeader className="flex justify-between items-center">
          <CardTitle className="text-base">Fotos</CardTitle>

          <Button size="sm" onClick={handleAddPhotos}>
            <Camera className="h-4 w-4 mr-1" /> Añadir fotos
          </Button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            multiple
            className="hidden"
            onChange={(e) => handleFileChange(e.target.files)}
          />
        </CardHeader>

        <CardContent>
          {(!task.images || task.images.length === 0) && (
            <p className="text-sm text-muted-foreground">
              No hay fotos adjuntas
            </p>
          )}

          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mt-2">
            {task.images?.map((img, i) => (
              <img
                key={i}
                src={img}
                alt=""
                className="w-full h-24 object-cover rounded border"
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ✅ MODAL EDITAR */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar tarea</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* ✅ Descripción */}
            <div className="space-y-1.5">
              <Label>Descripción *</Label>
              <Input
                value={taskForm.description}
                onChange={(e) =>
                  setTaskForm({ ...taskForm, description: e.target.value })
                }
              />
            </div>

            {/* ✅ Fecha / Hora */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Fecha</Label>
                <Input
                  type="date"
                  value={taskForm.date}
                  onChange={(e) =>
                    setTaskForm({ ...taskForm, date: e.target.value })
                  }
                />
              </div>

              <div className="space-y-1.5">
                <Label>Hora</Label>
                <Input
                  type="time"
                  value={taskForm.time}
                  onChange={(e) =>
                    setTaskForm({ ...taskForm, time: e.target.value })
                  }
                />
              </div>
            </div>

            {/* ✅ Dirección */}
            <div className="space-y-1.5">
              <Label>Dirección</Label>
              <Input
                value={taskForm.address}
                onChange={(e) =>
                  setTaskForm({ ...taskForm, address: e.target.value })
                }
              />
            </div>

            {/* ✅ Estado */}
            <div className="space-y-1.5">
              <Label>Estado *</Label>
              <Select
                value={taskForm.status}
                onValueChange={(value) =>
                  setTaskForm({ ...taskForm, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendiente</SelectItem>
                  <SelectItem value="in_progress">En progreso</SelectItem>
                  <SelectItem value="completed">Completada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* ✅ FOTOS dentro del modal */}
            <div className="space-y-2">
              <Label>Fotos</Label>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1"
              >
                <Camera className="h-4 w-4" /> Añadir fotos
              </Button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                multiple
                className="hidden"
                onChange={async (e) => {
                  const files = e.target.files;
                  if (!files) return;

                  const urls = await Promise.all(
                    Array.from(files).map((f) => uploadImageToCloudinary(f)),
                  );

                  setTaskForm((prev: any) => ({
                    ...prev,
                    images: [...(prev.images || []), ...urls],
                  }));
                }}
              />

              {taskForm.images?.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {taskForm.images.map((img: string, i: number) => (
                    <div key={i} className="relative group">
                      <img
                        src={img}
                        className="w-full h-24 object-cover rounded border"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(i)}
                        className="absolute top-1 right-1 bg-red-500 text-white text-xs px-1 rounded opacity-0 group-hover:opacity-100"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancelar
            </Button>

            <Button onClick={saveTask} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Guardando..." : "Guardar cambios"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TaskDetailPage;
