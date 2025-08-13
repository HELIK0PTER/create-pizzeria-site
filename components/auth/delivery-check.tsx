"use client";

import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

interface DeliveryCheckProps {
  children: React.ReactNode;
}

export function DeliveryCheck({ children }: DeliveryCheckProps) {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (!isPending) {
      if (!session?.user) {
        router.push("/auth/login");
        return;
      }

      const userRole = (session.user as unknown as { role: string })?.role;
      if (userRole !== "delivery" && userRole !== "admin") {
        router.push("/");
        return;
      }

      setIsChecking(false);
    }
  }, [session, isPending, router]);

  if (isPending || isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
          <p className="text-gray-600">Vérification des permissions...</p>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  return <>{children}</>;
}
