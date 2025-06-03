"use client";

import { AdminHeader } from "@/components/layout/header";
import { DefaultAdminCheck } from "@/components/auth/default-admin-check";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader />
      <DefaultAdminCheck />
      <main>{children}</main>
    </div>
  );
}
