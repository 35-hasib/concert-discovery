import { AlertCircle, KeyRound, Mail, ShieldCheck } from "lucide-react";
import { useState } from "react";

import { useAuth } from "../../context/AuthContext";
import { ApiError, api, errorMessage } from "../../lib/api";
import { showAdminToast } from "../../lib/toast";
import type { AdminUser } from "../../lib/types";
import { adminAccountSchema, formatZodErrors } from "../../lib/validation";
import { Spinner } from "../Spinner";

type AccountFormValues = {
  email: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export function AdminAccountForm() {
  const { user, updateSession } = useAuth();
  const [form, setForm] = useState<AccountFormValues>({
    email: user?.email || "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  function set<K extends keyof AccountFormValues>(key: K, value: AccountFormValues[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");

    const parsed = adminAccountSchema.safeParse(form);
    if (!parsed.success) {
      setErrors(formatZodErrors(parsed.error));
      setFormError("Please fix the highlighted fields before saving.");
      return;
    }

    setSaving(true);
    try {
      const data = await api<{ token: string; admin: AdminUser }>("/auth/account", {
        method: "PUT",
        body: parsed.data,
      });
      updateSession(data.token, data.admin);
      setForm((current) => ({
        ...current,
        email: data.admin.email,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));
      setErrors({});
      showAdminToast({ message: "Email and password settings saved." });
    } catch (saveError) {
      if (saveError instanceof ApiError && saveError.fieldErrors) {
        setErrors(saveError.fieldErrors);
      }
      setFormError(errorMessage(saveError));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="admin-card">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-ember-600">
            Admin access
          </p>
          <h2 className="mt-1 font-display text-[32px] font-normal uppercase leading-none text-[#535353]">
            Email and password
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-ink-600">
            Change the email and password used to sign in to this admin dashboard. Your
            current password is required to save any changes.
          </p>
        </div>
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-ember-50 text-ember-600">
          <ShieldCheck className="h-5 w-5" />
        </span>
      </div>

      {formError ? (
        <div
          className="mt-5 flex items-start gap-2.5 rounded-[3px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {formError}
        </div>
      ) : null}

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <div className="lg:col-span-2">
          <label htmlFor="adminEmail" className="field-label">
            Admin email
          </label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#999999]" />
            <input
              id="adminEmail"
              type="email"
              value={form.email}
              onChange={(event) => set("email", event.target.value)}
              className="input pl-9"
              autoComplete="email"
              maxLength={200}
            />
          </div>
          {errors.email ? <p className="field-error">{errors.email}</p> : null}
        </div>

        <div>
          <label htmlFor="currentPassword" className="field-label">
            Current password <span className="text-ember-600">*</span>
          </label>
          <div className="relative">
            <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#999999]" />
            <input
              id="currentPassword"
              type="password"
              value={form.currentPassword}
              onChange={(event) => set("currentPassword", event.target.value)}
              className="input pl-9"
              autoComplete="current-password"
              maxLength={200}
            />
          </div>
          {errors.currentPassword ? (
            <p className="field-error">{errors.currentPassword}</p>
          ) : null}
        </div>

        <div>
          <label htmlFor="newPassword" className="field-label">
            New password
          </label>
          <div className="relative">
            <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#999999]" />
            <input
              id="newPassword"
              type="password"
              value={form.newPassword}
              onChange={(event) => set("newPassword", event.target.value)}
              className="input pl-9"
              autoComplete="new-password"
              maxLength={200}
            />
          </div>
          <p className="field-hint">Leave blank to keep your current password.</p>
          {errors.newPassword ? <p className="field-error">{errors.newPassword}</p> : null}
        </div>

        <div>
          <label htmlFor="confirmPassword" className="field-label">
            Confirm new password
          </label>
          <div className="relative">
            <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#999999]" />
            <input
              id="confirmPassword"
              type="password"
              value={form.confirmPassword}
              onChange={(event) => set("confirmPassword", event.target.value)}
              className="input pl-9"
              autoComplete="new-password"
              maxLength={200}
            />
          </div>
          {errors.confirmPassword ? (
            <p className="field-error">{errors.confirmPassword}</p>
          ) : null}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[#eeeeee] pt-5">
        <p className="text-xs text-[#888888]">
          New password must be at least 8 characters.
        </p>
        <button type="submit" disabled={saving} className="btn-primary btn-sm">
          {saving ? <Spinner className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
          Update account
        </button>
      </div>
    </form>
  );
}
