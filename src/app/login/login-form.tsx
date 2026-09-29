"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { api, ApiError } from "@/lib/api/client";

const schema = z.object({
  email: z.email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password"),
});
type Values = z.infer<typeof schema>;

export function LoginForm({ next }: { next: string }) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const { register, handleSubmit, formState } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { email: "admin@almahy.demo", password: "" } });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await api("/api/auth/login", { method: "POST", json: values });
      router.replace(next);
      router.refresh();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Sign-in failed. Try again.");
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="mt-6 flex flex-col gap-4">
      {formError && (
        <p role="alert" className="rounded-control border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">
          {formError}
        </p>
      )}
      <Field label="Email" error={formState.errors.email?.message}>
        <Input type="email" autoComplete="username" {...register("email")} />
      </Field>
      <Field label="Password" error={formState.errors.password?.message}>
        <Input type="password" autoComplete="current-password" autoFocus {...register("password")} />
      </Field>
      <Button type="submit" loading={formState.isSubmitting} className="mt-2 w-full">
        Sign in
      </Button>
    </form>
  );
}
