import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Eye, EyeOff, Lock } from "lucide-react"

type PasswordInputProps = {
  id: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
  required?: boolean
}

export function PasswordInput({ id, value, onChange, placeholder, required }: PasswordInputProps) {
  const [show, setShow] = useState(false)

  return (
    <div className="relative">
      <Lock className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
      <Input
        id={id}
        className="pl-9"
        type={show ? "text" : "password"}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground hover:bg-transparent"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"}
      >
        {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </Button>
    </div>
  )
}
