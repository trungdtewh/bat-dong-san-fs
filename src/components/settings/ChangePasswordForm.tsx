"use client";

import { useActionState, useEffect, useRef } from "react";
import { Eye, EyeOff, KeyRound, Loader2 } from "lucide-react";
import { useState } from "react";
import { changePasswordAction } from "@/app/(app)/thiet-lap/actions";

function PasswordInput({
  id,
  name,
  label,
  disabled,
  error,
  autoComplete,
}: {
  id: string;
  name: string;
  label: string;
  disabled: boolean;
  error?: string;
  autoComplete?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-gray-700">
        {label}
      </label>
      <div className="relative sm:max-w-sm">
        <input
          id={id}
          name={name}
          type={show ? "text" : "password"}
          autoComplete={autoComplete}
          disabled={disabled}
          required
          className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-10 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:opacity-60"
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setShow((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

export default function ChangePasswordForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, isPending] = useActionState(changePasswordAction, null);

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      <div className="flex items-center gap-3 border-b border-gray-100 px-6 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50">
          <KeyRound className="h-4 w-4 text-amber-600" />
        </div>
        <h2 className="text-base font-semibold text-gray-900">Đổi mật khẩu</h2>
      </div>

      <div className="px-6 py-5">
        <form ref={formRef} action={action} className="space-y-4">
          <PasswordInput
            id="currentPassword"
            name="currentPassword"
            label="Mật khẩu hiện tại"
            disabled={isPending}
            autoComplete="current-password"
            error={state?.errors?.currentPassword?.[0]}
          />

          <PasswordInput
            id="newPassword"
            name="newPassword"
            label="Mật khẩu mới"
            disabled={isPending}
            autoComplete="new-password"
            error={state?.errors?.newPassword?.[0]}
          />
          {!state?.errors?.newPassword && (
            <p className="mt-1 text-xs text-gray-500">
              Tối thiểu 8 ký tự, có chữ hoa và chữ số. Phải khác mật khẩu hiện tại.
            </p>
          )}

          <PasswordInput
            id="confirmPassword"
            name="confirmPassword"
            label="Xác nhận mật khẩu mới"
            disabled={isPending}
            autoComplete="new-password"
            error={state?.errors?.confirmPassword?.[0]}
          />

          {state?.success && (
            <p className="text-sm text-green-600">{state.message}</p>
          )}
          {state && !state.success && state.message && (
            <p className="text-sm text-red-600">{state.message}</p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Đổi mật khẩu
          </button>
        </form>
      </div>
    </div>
  );
}
