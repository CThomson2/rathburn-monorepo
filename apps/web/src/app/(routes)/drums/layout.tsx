"use client";

export default function DrumsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <main className="flex-1 p-4">{children}</main>;
}
