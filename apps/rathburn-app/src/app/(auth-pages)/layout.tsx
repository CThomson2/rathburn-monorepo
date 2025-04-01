import { AuthLayoutContent } from "@/components/layouts/auth/auth";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthLayoutContent>{children}</AuthLayoutContent>;
}
