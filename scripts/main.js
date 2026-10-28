const slides = Array.from(document.querySelectorAll(".album-slide"));
const dots = Array.from(document.querySelectorAll(".album-dots span"));
let activeIndex = 0;
let timerId;

function showSlide(nextIndex) {
  if (!slides.length) return;

  activeIndex = (nextIndex + slides.length) % slides.length;

  slides.forEach((slide, index) => {
    slide.classList.toggle("is-active", index === activeIndex);
  });

  dots.forEach((dot, index) => {
    dot.classList.toggle("is-active", index === activeIndex);
  });
}

function startAlbum() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || slides.length < 2) {
    showSlide(0);
    return;
  }

  timerId = window.setInterval(() => {
    showSlide(activeIndex + 1);
  }, 3200);
}

window.addEventListener("pagehide", () => {
  if (timerId) window.clearInterval(timerId);
});

showSlide(0);
startAlbum();

const rsvpOpenButton = document.querySelector(".rsvp-design-button");
const rsvpDialog = document.getElementById("rsvpDialog");
const rsvpForm = document.getElementById("rsvpForm");
const rsvpStatus = document.getElementById("rsvpStatus");
const rsvpNameInput = document.querySelector(".rsvp-name-input");

function setRsvpStatus(message, isError = false) {
  if (!rsvpStatus) return;
  rsvpStatus.textContent = message;
  rsvpStatus.style.color = isError ? "#d72f6d" : "#00477f";
}

function openRsvpDialog() {
  if (!rsvpDialog) return;
  rsvpDialog.hidden = false;
  document.body.classList.add("rsvp-open");
  setRsvpStatus("");
  window.setTimeout(() => rsvpNameInput?.focus(), 60);
}

function closeRsvpDialog() {
  if (!rsvpDialog) return;
  rsvpDialog.hidden = true;
  document.body.classList.remove("rsvp-open");
  rsvpOpenButton?.focus();
}

function getPublicSupabaseConfig() {
  const config = window.SUPABASE_CONFIG || {};
  const url = String(config.url || "").trim().replace(/\/$/, "");
  const publishableKey = String(config.publishableKey || "").trim();
  const table = String(config.table || "wedding_rsvps").trim();

  if (!url || !publishableKey || !table) return null;

  return { url, publishableKey, table };
}

async function submitRsvp(payload) {
  const config = getPublicSupabaseConfig();

  if (!config) {
    return fetch("/api/rsvp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
  }

  const headers = {
    "Content-Type": "application/json",
    "apikey": config.publishableKey,
    "Prefer": "return=minimal"
  };

  // Legacy anon keys are JWTs and can also be used as the bearer token.
  if (config.publishableKey.startsWith("eyJ")) {
    headers.Authorization = `Bearer ${config.publishableKey}`;
  }

  return fetch(`${config.url}/rest/v1/${encodeURIComponent(config.table)}`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      full_name: payload.fullName,
      attendance: payload.attendance,
      guest_count: payload.attendance ? payload.guestCount : 0,
      user_agent: navigator.userAgent || null
    })
  });
}

rsvpOpenButton?.addEventListener("click", openRsvpDialog);

rsvpDialog?.addEventListener("click", (event) => {
  if (event.target?.hasAttribute("data-rsvp-close")) {
    closeRsvpDialog();
  }
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && rsvpDialog && !rsvpDialog.hidden) {
    closeRsvpDialog();
  }
});

rsvpForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const submitButton = rsvpForm.querySelector(".rsvp-submit");
  const formData = new FormData(rsvpForm);
  const payload = {
    fullName: String(formData.get("fullName") || "").trim(),
    attendance: formData.get("attendance") === "yes",
    guestCount: Number(formData.get("guestCount") || 1)
  };

  if (!payload.fullName) {
    setRsvpStatus("Vui lòng nhập họ và tên.", true);
    rsvpNameInput?.focus();
    return;
  }

  submitButton.disabled = true;
  setRsvpStatus("Đang gửi xác nhận...");

  try {
    const response = await submitRsvp(payload);

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        result.message ||
        result.error_description ||
        result.hint ||
        "Không thể gửi xác nhận."
      );
    }

    setRsvpStatus("Đã gửi xác nhận. Cảm ơn bạn!");
    rsvpForm.reset();
    rsvpForm.elements.attendance.value = "yes";
  } catch (error) {
    const isNetworkError = error instanceof TypeError && error.message === "Failed to fetch";
    const message = isNetworkError
      ? "Không thể kết nối máy chủ xác nhận. Vui lòng kiểm tra mạng và thử lại."
      : error.message || "Có lỗi xảy ra, vui lòng thử lại.";

    setRsvpStatus(message, true);
  } finally {
    submitButton.disabled = false;
  }
});
