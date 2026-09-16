import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { LogOut, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";

import { BrandMark, BrandWordmark } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { ROLE_LABEL } from "@/lib/roles";
import { NASHIK } from "@/lib/geo";

function initials(name: string, email: string): string {
  const source = name.trim() || email;
  const parts = source.split(/[\s@._-]+/).filter(Boolean);
  return (parts[0]?.[0] ?? "U").concat(parts[1]?.[0] ?? "").toUpperCase();
}

export function AppShell({ children }: { children: ReactNode }) {
  const { profile, user, role } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    void navigate({ to: "/auth", replace: true });
  }

  const displayName = profile?.full_name || user?.email || "Account";

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-500 flex h-14 shrink-0 items-center gap-4 border-b border-border bg-surface/90 px-4 backdrop-blur">
        <Link to="/workspace" className="flex items-center gap-2">
          <BrandMark className="size-6" />
          <BrandWordmark className="text-base" />
        </Link>

        <span className="hidden items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground sm:flex">
          <ShieldCheck className="size-3.5 text-primary" />
          {NASHIK.name}
        </span>

        <div className="ml-auto flex items-center gap-3">
          {role ? (
            <Badge variant="outline" className="border-primary/40 text-primary">
              {ROLE_LABEL[role]}
            </Badge>
          ) : null}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2 px-2">
                <span className="mono-num flex size-7 items-center justify-center rounded-full bg-accent text-xs font-medium">
                  {initials(profile?.full_name ?? "", user?.email ?? "")}
                </span>
                <span className="hidden max-w-40 truncate text-sm sm:inline">{displayName}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60">
              <DropdownMenuLabel className="space-y-0.5">
                <p className="truncate text-sm">{displayName}</p>
                <p className="truncate text-xs font-normal text-muted-foreground">
                  {user?.email}
                </p>
                {profile?.organization ? (
                  <p className="truncate text-xs font-normal text-muted-foreground">
                    {profile.organization}
                  </p>
                ) : null}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => void handleSignOut()}>
                <LogOut className="size-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="flex min-h-0 flex-1 flex-col">{children}</main>
    </div>
  );
}