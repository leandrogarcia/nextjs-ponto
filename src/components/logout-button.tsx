"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <Button
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={() =>
        start(async () => {
          await fetch("/api/auth/session", { method: "DELETE" });
          router.replace("/login");
          router.refresh();
        })
      }
    >
      Sair
    </Button>
  );
}
