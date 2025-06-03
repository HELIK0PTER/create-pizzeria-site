"use client";

import { AdminHeader } from "@/components/layout/header";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader />
      <main>{children}</main>
    </div>
  );
}
