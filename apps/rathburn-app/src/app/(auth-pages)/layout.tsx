import { AuthLayoutContent } from "@/components/layout/auth/auth";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthLayoutContent>{children}</AuthLayoutContent>;
}
