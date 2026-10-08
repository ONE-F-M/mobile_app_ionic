const stripHtml = (text) => text.replace(/<[^>]*>/g, "").trim();

// Frappe sends frappe.throw() text in _server_messages (a JSON list of JSON strings), else in exception
export const getFrappeErrorMessage = (error) => {
  const data = error?.data;
  if (!data || typeof data !== "object") return null;

  if (data._server_messages) {
    try {
      const messages = JSON.parse(data._server_messages)
        .map((raw) => {
          const parsed = JSON.parse(raw);
          return stripHtml(parsed.message || "");
        })
        .filter(Boolean);
      if (messages.length) return messages.join("\n");
    } catch (e) {
      console.warn("Could not parse _server_messages", e);
    }
  }

  if (typeof data.exception === "string") {
    return stripHtml(data.exception.replace(/^[\w.]+Error:\s*/, ""));
  }

  return null;
};
