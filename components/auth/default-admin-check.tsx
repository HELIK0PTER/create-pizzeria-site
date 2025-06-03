"use client";

import { authClient } from "@/lib/auth-client";
import { useEffect, useState } from "react";
import { FaExclamationTriangle } from "react-icons/fa";

// Utiliser le type de Better Auth directement
type BetterAuthUser = Awaited<
  ReturnType<typeof authClient.admin.listUsers>
>["data"]["users"][0];

export const DefaultAdminCheck = () => {
  const [users, setUsers] = useState<BetterAuthUser[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      const { data } = await authClient.admin.listUsers({
        query: {
          searchValue: "admin@admin.com",
          searchField: "email",
          searchOperator: "contains",
          limit: 10,
        },
      });
      if (data?.users) {
        setUsers(data.users);
      }
    };
    fetchUsers();
  }, []);

  if (users.length === 0) {
    return <></>;
  }

  return (
    <div className="p-4 bg-red-500 text-red-100">
      <div className="flex items-center justify-center gap-3">
        <span className="animate-pulse text-2xl">
          <FaExclamationTriangle />
        </span>
        <h1 className="text-xl font-bold">
          Attention, vous n&apos;avez pas encore supprimé l&apos;utilisateur
          admin par défaut
        </h1>
        <span className="animate-pulse text-2xl">
          <FaExclamationTriangle />
        </span>
      </div>
    </div>
  );
};
