(() => {
  const config = window.SUPABASE_CONFIG || {};
  const supabaseUrl = String(config.url || "").trim().replace(/\/$/, "");
  const publishableKey = String(config.publishableKey || "").trim();
  const tableName = String(config.table || "wedding_rsvps").trim();

  const dataMessage = document.getElementById("dataMessage");
  const rowsElement = document.getElementById("rsvpRows");
  const responseTotal = document.getElementById("responseTotal");
  const attendeeTotal = document.getElementById("attendeeTotal");
  const footerAttendeeTotal = document.getElementById("footerAttendeeTotal");
  const declineTotal = document.getElementById("declineTotal");
  const refreshButton = document.getElementById("refreshButton");
  const csvButton = document.getElementById("csvButton");

  let refreshTimer = null;
  let isLoading = false;
  let rsvps = [];

  function setMessage(message, isError = false) {
    dataMessage.textContent = message;
    dataMessage.classList.toggle("error", isError);
  }

  function formatTimestamp(value) {
    const date = new Date(value);
    return Number.isNaN(date.valueOf()) ? "—" : new Intl.DateTimeFormat("vi-VN", {
      dateStyle: "medium",
      timeStyle: "short"
    }).format(date);
  }

  function makeCell(value, className = "") {
    const cell = document.createElement("td");
    cell.textContent = value;
    if (className) cell.className = className;
    return cell;
  }

  function renderRows() {
    rowsElement.replaceChildren();
    if (!rsvps.length) {
      const row = document.createElement("tr");
      const cell = makeCell("Chưa có phản hồi nào.", "empty-state");
      cell.colSpan = 4;
      row.append(cell);
      rowsElement.append(row);
      return;
    }

    const fragment = document.createDocumentFragment();
    rsvps.forEach((rsvp) => {
      const row = document.createElement("tr");
      row.append(
        makeCell(rsvp.full_name || ""),
        makeCell(rsvp.attendance ? "Có" : "Không", rsvp.attendance ? "attending" : "not-attending"),
        makeCell(String(rsvp.attendance ? Number(rsvp.guest_count) || 0 : 0)),
        makeCell(formatTimestamp(rsvp.created_at))
      );
      fragment.append(row);
    });
    rowsElement.append(fragment);
  }

  function updateTotals() {
    const totalAttendees = rsvps.reduce((total, rsvp) =>
      total + (rsvp.attendance ? Number(rsvp.guest_count) || 0 : 0), 0);
    responseTotal.textContent = String(rsvps.length);
    attendeeTotal.textContent = String(totalAttendees);
    footerAttendeeTotal.textContent = String(totalAttendees);
    declineTotal.textContent = String(rsvps.filter((rsvp) => !rsvp.attendance).length);
  }

  async function fetchRows() {
    if (isLoading || !supabaseUrl || !publishableKey || !tableName) return;
    isLoading = true;
    try {
      const query = new URLSearchParams({
        select: "full_name,attendance,guest_count,created_at",
        order: "created_at.desc"
      });
      const response = await fetch(`${supabaseUrl}/rest/v1/${encodeURIComponent(tableName)}?${query}`, {
        headers: {
          apikey: publishableKey,
          Accept: "application/json"
        },
        cache: "no-store"
      });

      if (!response.ok) {
        throw new Error(response.status === 401 || response.status === 403
          ? "Supabase chưa cấp quyền đọc công khai. Chạy supabase_public_read_policy.sql rồi thử lại."
          : `Không tải được RSVP (HTTP ${response.status}).`);
      }

      rsvps = await response.json();
      renderRows();
      updateTotals();
      setMessage(`Đã cập nhật lúc ${formatTimestamp(new Date().toISOString())}.`);
    } catch (error) {
      setMessage(error.message || "Không thể tải dữ liệu RSVP.", true);
    } finally {
      isLoading = false;
    }
  }

  function toCsvValue(value) {
    const text = String(value ?? "");
    const safeText = /^[\s]*[=+\-@]/.test(text) ? `'${text}` : text;
    return `"${safeText.replace(/"/g, '""')}"`;
  }

  function downloadCsv() {
    const totalAttendees = rsvps.reduce((total, rsvp) =>
      total + (rsvp.attendance ? Number(rsvp.guest_count) || 0 : 0), 0);
    const headings = ["Họ và tên", "Tham dự", "Số khách", "Thời gian phản hồi"];
    const lines = [headings, ...rsvps.map((rsvp) => [
      rsvp.full_name,
      rsvp.attendance ? "Có" : "Không",
      rsvp.attendance ? Number(rsvp.guest_count) || 0 : 0,
      rsvp.created_at
    ]), [], ["Tổng khách tham dự", "", totalAttendees, ""]]
      .map((line) => line.map(toCsvValue).join(","));
    const blob = new Blob(["\uFEFF", lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `wedding-rsvps-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  refreshButton.addEventListener("click", fetchRows);
  csvButton.addEventListener("click", downloadCsv);

  if (!supabaseUrl || !publishableKey || !tableName) {
    setMessage("Chưa có cấu hình Supabase. Kiểm tra cấu hình GitHub Pages rồi deploy lại.", true);
    return;
  }

  fetchRows();
  refreshTimer = window.setInterval(fetchRows, 15_000);
  window.addEventListener("pagehide", () => window.clearInterval(refreshTimer), { once: true });
})();
