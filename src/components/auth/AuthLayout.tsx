import type { ReactNode } from "react"
import { Card, CardContent } from "@/components/ui/card"

type AuthLayoutProps = {
  title?: string
  subtitle?: string
  children: ReactNode
  asideImageSrc?: string
  asideAlt?: string
  variant?: "split" | "centered"
  logoSrc?: string
  logoAlt?: string
}

export default function AuthLayout({
  title,
  subtitle,
  children,
  asideImageSrc = "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=1200&auto=format&fit=crop",
  asideAlt = "Imagen de fondo",
  variant = "split",
  logoSrc,
  logoAlt = "Logo",
}: AuthLayoutProps) {
  if (variant === "centered") {
    return (
      <div className="relative min-h-[100dvh] flex items-center justify-center bg-background">
        <div className="w-[95vw] max-w-[520px] p-4">
          <Card className="overflow-hidden border shadow-sm py-0">
            <CardContent className="p-6 md:p-8">
              {(title || subtitle || logoSrc) && (
                <div className="mb-6 text-center">
                  {logoSrc && (
                    <img src={logoSrc} alt={logoAlt} className="mx-auto mb-2 h-8 w-auto" />
                  )}
                  {title && <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>}
                  {subtitle && (
                    <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
                  )}
                </div>
              )}
              {children}
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[100dvh] grid md:grid-cols-2">
      <div className="relative hidden bg-muted md:block">
        {asideImageSrc ? (
          <img
            src={asideImageSrc}
            alt={asideAlt}
            className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent" />
        )}
      </div>
      <div className="flex items-center justify-center p-6 md:p-12 bg-background">
        <div className="w-full max-w-[480px]">
          <Card className="overflow-hidden border shadow-sm py-0">
            <CardContent className="p-6 md:p-8">
              {(title || subtitle || logoSrc) && (
                <div className="mb-6 text-center">
                  {logoSrc && (
                    <img src={logoSrc} alt={logoAlt} className="mx-auto mb-2 h-8 w-auto" />
                  )}
                  {title && <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>}
                  {subtitle && (
                    <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
                  )}
                </div>
              )}
              {children}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
