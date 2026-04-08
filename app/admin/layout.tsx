// Minimal wrapper — auth is handled per route group.
// The (protected) group has its own layout with the auth guard + nav shell.
// The login page sits outside (protected) and renders standalone.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
