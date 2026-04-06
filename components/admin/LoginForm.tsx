"use client";

import type { ReactElement } from "react";
import { useState } from "react";
import Link from "next/link";

import { loginAdminAction } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Admin sign-in form (session established via server action + Supabase Auth).
 */
export function LoginForm(): ReactElement {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <div
      dir="rtl"
      className="flex min-h-[100dvh] flex-col items-center justify-center bg-[#F9F9F7] px-4 py-16 text-zinc-900"
    >
      <div className="w-full max-w-md space-y-10">
        <div className="space-y-2 text-center">
          <h1 className="font-heading text-3xl font-bold tracking-tight text-zinc-900 md:text-4xl">
            התחברות למערכת
          </h1>
          <p className="text-sm leading-relaxed text-zinc-600">
            הזינו את פרטי החשבון כדי לגשת לניהול התוכן.
          </p>
        </div>

        <form
          className="space-y-6 rounded-2xl border border-zinc-200/80 bg-white p-8 shadow-sm"
          action={async (formData) => {
            setError(null);
            setPending(true);
            try {
              const result = await loginAdminAction(formData);
              if (result !== undefined && result !== null && "error" in result) {
                setError(result.error);
              }
            } finally {
              setPending(false);
            }
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="admin-email" className="text-zinc-800">
              דוא״ל
            </Label>
            <Input
              id="admin-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              dir="ltr"
              className="border-zinc-200 bg-white text-zinc-900"
              placeholder="name@example.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="admin-password" className="text-zinc-800">
              סיסמה
            </Label>
            <Input
              id="admin-password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              dir="ltr"
              className="border-zinc-200 bg-white text-zinc-900"
            />
          </div>

          {error !== null ? (
            <p
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900"
              role="alert"
            >
              {error}
            </p>
          ) : null}

          <Button
            type="submit"
            className="h-11 w-full text-base font-medium"
            disabled={pending}
          >
            {pending ? "מתחבר…" : "התחברות"}
          </Button>
        </form>

        <p className="text-center text-sm text-zinc-500">
          <Link
            href="/"
            className="font-medium text-zinc-700 underline-offset-4 hover:text-zinc-900 hover:underline"
          >
            ← חזרה לאתר
          </Link>
        </p>
      </div>
    </div>
  );
}
