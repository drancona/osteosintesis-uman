export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <main className="relative flex flex-1 items-center justify-center px-4 py-12">
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-primary-soft via-background to-background dark:from-primary-soft dark:via-background dark:to-background"
        aria-hidden
      />
      <div className="w-full max-w-md">{children}</div>
    </main>
  )
}
