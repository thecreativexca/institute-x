export type OfficeTicketAction = "resolve" | "close" | "reopen";

export async function runOfficeTicketAction(
  ticketId: string,
  action: OfficeTicketAction
): Promise<{ success: true } | { success: false; error: string }> {
  const formData = new FormData();
  formData.set("action", action);

  try {
    const response = await fetch(`/api/office/support/${ticketId}`, {
      method: "PATCH",
      body: formData,
    });
    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.error || "Unable to update ticket." };
    }
    return { success: true };
  } catch {
    return { success: false, error: "Unable to update ticket right now." };
  }
}
