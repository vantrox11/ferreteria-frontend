import { useState, useRef } from "react";
import { Upload, X, Loader2, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { customInstance } from "@/api/mutator/custom-instance";

type ImageUploaderProps = {
  productoId: number;
  currentImageUrl?: string | null;
  onUploadSuccess?: (imageUrl: string) => void;
  onDelete?: () => void;
};

export default function ImageUploader({
  productoId,
  currentImageUrl,
  onUploadSuccess,
  onDelete,
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!validTypes.includes(file.type)) {
      toast.error("Tipo de archivo inválido. Solo se permiten: JPEG, PNG, WebP, GIF");
      return;
    }

    // Validar tamaño (5MB máximo)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error("Archivo demasiado grande. Tamaño máximo: 5MB");
      return;
    }

    // Mostrar preview local
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Subir a backend
    setUploading(true);
    const formData = new FormData();
    formData.append("imagen", file);

    try {
      const response = await customInstance<{ message: string; producto: { imagen_url: string } }>(
        {
          url: `/api/productos/${productoId}/upload-imagen`,
          method: "POST",
          data: formData,
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const imageUrl = response.producto.imagen_url;
      setPreviewUrl(imageUrl);
      toast.success("Imagen subida exitosamente");
      onUploadSuccess?.(imageUrl);
    } catch (error: any) {
      console.error("Error al subir imagen:", error);
      const message =
        error?.response?.data?.message || error?.message || "Error al subir imagen";
      toast.error(message);
      // Restaurar imagen anterior si falla
      setPreviewUrl(currentImageUrl || null);
    } finally {
      setUploading(false);
      // Limpiar input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDelete = async () => {
    if (!previewUrl) return;

    setUploading(true);
    try {
      await customInstance({
        url: `/api/productos/${productoId}/imagen`,
        method: "DELETE",
      });

      setPreviewUrl(null);
      toast.success("Imagen eliminada");
      onDelete?.();
    } catch (error: any) {
      const message =
        error?.response?.data?.message || error?.message || "Error al eliminar imagen";
      toast.error(message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium">Imagen del producto</label>

      {/* Preview o placeholder */}
      <div className="relative w-full aspect-square max-w-xs rounded-lg border-2 border-dashed border-muted-foreground/25 overflow-hidden bg-muted/50">
        {previewUrl ? (
          <>
            <img
              src={previewUrl}
              alt="Preview"
              className="w-full h-full object-cover"
            />
            {!uploading && (
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2"
                onClick={handleDelete}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <ImageIcon className="h-12 w-12 mb-2" />
            <p className="text-sm">Sin imagen</p>
          </div>
        )}

        {uploading && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
      </div>

      {/* Botón de subida */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileSelect}
        className="hidden"
        disabled={uploading}
      />

      <Button
        type="button"
        variant="outline"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="w-full max-w-xs"
      >
        <Upload className="mr-2 h-4 w-4" />
        {previewUrl ? "Cambiar imagen" : "Subir imagen"}
      </Button>

      <p className="text-xs text-muted-foreground">
        Formatos: JPG, PNG, WebP, GIF • Máximo: 5MB
      </p>
    </div>
  );
}
