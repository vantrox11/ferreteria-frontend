import { useState, useRef } from "react";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type ImagePreviewProps = {
  value?: string | File | null; // Puede ser URL (string) o File
  onChange?: (file: File | null) => void;
  disabled?: boolean;
};

export default function ImagePreview({
  value,
  onChange,
  disabled = false,
}: ImagePreviewProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    typeof value === "string" ? value : null
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
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

    // Notificar cambio al padre
    onChange?.(file);
  };

  const handleRemove = () => {
    setPreviewUrl(null);
    onChange?.(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-start gap-4">
        <div className="relative aspect-square w-20 md:w-28 rounded-lg border-2 border-dashed border-muted-foreground/25 overflow-hidden bg-muted/50">
          {previewUrl ? (
            <>
              <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
              {!disabled && (
                <Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2" onClick={handleRemove}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <ImageIcon className="h-10 w-10 mb-1" />
              <p className="text-xs">Sin imagen</p>
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Imagen del producto</label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleFileSelect}
            className="hidden"
            disabled={disabled}
          />
          <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={disabled}>
            <Upload className="mr-2 h-4 w-4" />
            {previewUrl ? "Cambiar imagen" : "Seleccionar imagen"}
          </Button>
          <p className="text-xs text-muted-foreground">Formatos: JPG, PNG, WebP, GIF • Máximo: 5MB</p>
        </div>
      </div>
    </div>
  );
}
