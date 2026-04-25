"use client"

import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Check, Copy, Loader2, RefreshCcw } from "lucide-react"

import {
  crearCuentaProveedorAction,
  type CrearProveedorResult,
} from "@/app/(app)/admin/usuarios/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
} from "@/components/ui/dialog"
import { DialogTitle } from "@radix-ui/react-dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

const schema = z.object({
  nombre_completo: z.string().trim().min(3, "Mínimo 3 caracteres"),
  email: z.string().email("Email inválido"),
  identificador: z.string().trim().optional(),
  password: z.string().min(8, "Mínimo 8 caracteres"),
})
type FormValues = z.infer<typeof schema>

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  onCreated: () => void
}

function generarPassword(): string {
  const sufijos = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"
  let bloque = ""
  for (let i = 0; i < 4; i++) {
    bloque += sufijos[Math.floor(Math.random() * sufijos.length)]
  }
  return `Prov-${bloque}-${new Date().getFullYear()}`
}

export function DialogCrearProveedor({ open, onOpenChange, onCreated }: Props) {
  const [submitting, setSubmitting] = useState(false)
  const [, startTransition] = useTransition()
  const [resultado, setResultado] = useState<CrearProveedorResult | null>(null)
  const [emailCopiado, setEmailCopiado] = useState(false)
  const [passCopiada, setPassCopiada] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      nombre_completo: "",
      email: "",
      identificador: "",
      password: generarPassword(),
    },
  })

  function regenerar() {
    form.setValue("password", generarPassword(), { shouldDirty: true })
  }

  async function copiar(texto: string, marcar: (v: boolean) => void) {
    try {
      await navigator.clipboard.writeText(texto)
      marcar(true)
      setTimeout(() => marcar(false), 1500)
    } catch {
      toast.error("No se pudo copiar al portapapeles")
    }
  }

  function onSubmit(values: FormValues) {
    setSubmitting(true)
    startTransition(async () => {
      const r = await crearCuentaProveedorAction({
        nombre_completo: values.nombre_completo,
        email: values.email,
        identificador: values.identificador || null,
        password: values.password,
      })
      setSubmitting(false)
      if (r.error) {
        toast.error(r.error)
        return
      }
      toast.success("Cuenta creada. Copia la contraseña antes de cerrar.")
      setResultado(r)
      onCreated()
    })
  }

  function handleClose(v: boolean) {
    if (!v) {
      // Al cerrar reseteamos para la próxima vez.
      setResultado(null)
      setEmailCopiado(false)
      setPassCopiada(false)
      form.reset({
        nombre_completo: "",
        email: "",
        identificador: "",
        password: generarPassword(),
      })
    }
    onOpenChange(v)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {resultado ? "Cuenta de proveedor creada" : "Crear cuenta de proveedor"}
          </DialogTitle>
        </DialogHeader>

        {resultado ? (
          <div className="space-y-4">
            <Alert>
              <AlertTitle>Guarda la contraseña ahora</AlertTitle>
              <AlertDescription>
                Esta es la única vez que la verás. Cópiala y compártesela al
                proveedor por un canal seguro. Él podrá cambiarla después
                desde su cuenta.
              </AlertDescription>
            </Alert>

            <div className="rounded-lg border bg-muted/40 p-3 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase text-muted-foreground">
                    Email
                  </p>
                  <p className="font-mono text-sm break-all">
                    {resultado.email}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => copiar(resultado.email!, setEmailCopiado)}
                  aria-label="Copiar email"
                >
                  {emailCopiado ? (
                    <Check className="size-4 text-success" />
                  ) : (
                    <Copy className="size-4" />
                  )}
                </Button>
              </div>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase text-muted-foreground">
                    Contraseña temporal
                  </p>
                  <p className="font-mono text-sm break-all">
                    {resultado.password}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => copiar(resultado.password!, setPassCopiada)}
                  aria-label="Copiar contraseña"
                >
                  {passCopiada ? (
                    <Check className="size-4 text-success" />
                  ) : (
                    <Copy className="size-4" />
                  )}
                </Button>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                onClick={() => handleClose(false)}
                className="button-ios"
              >
                Cerrar
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4"
              noValidate
            >
              <FormField
                control={form.control}
                name="nombre_completo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre completo o empresa</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Ej. Insumos Yucatán SA de CV" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email (será su login)</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        autoComplete="off"
                        {...field}
                        placeholder="proveedor@empresa.com"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="identificador"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Identificador (RFC, número interno…)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value ?? ""}
                        placeholder="Opcional"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contraseña temporal</FormLabel>
                    <div className="flex gap-2">
                      <FormControl>
                        <Input {...field} className="font-mono" />
                      </FormControl>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={regenerar}
                        aria-label="Generar otra contraseña"
                      >
                        <RefreshCcw className="size-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      El proveedor podrá cambiarla después de iniciar sesión.
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="gap-2 sm:gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleClose(false)}
                  disabled={submitting}
                  className="button-ios"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="button-ios"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Creando…
                    </>
                  ) : (
                    "Crear cuenta"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  )
}
