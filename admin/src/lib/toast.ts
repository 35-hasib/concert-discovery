export type AdminToastTone = "success" | "error";

export type AdminToastPayload = {
  message: string;
  tone?: AdminToastTone;
};

export const ADMIN_TOAST_EVENT = "cd-admin:toast";

export function showAdminToast(payload: AdminToastPayload) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<AdminToastPayload>(ADMIN_TOAST_EVENT, { detail: payload })
  );
}
