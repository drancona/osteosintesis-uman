import Image from "next/image"
import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"
import { HOSPITAL } from "@/lib/constants"
import { RegisterForm } from "@/components/forms/RegisterForm"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default async function RegisterPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect("/")
  }

  return (
    <Card className="glass-strong rounded-2xl border-0 shadow-xl">
      <CardHeader className="items-center text-center space-y-3">
        <Image
          src="/logo_imss.png"
          alt="IMSS"
          width={56}
          height={56}
          priority
          className="rounded-md"
        />
        <div className="space-y-1">
          <CardTitle className="text-2xl font-semibold tracking-tight">
            Crear cuenta
          </CardTitle>
          <CardDescription>
            {HOSPITAL.nombre} · {HOSPITAL.servicio}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <RegisterForm />
      </CardContent>
    </Card>
  )
}
