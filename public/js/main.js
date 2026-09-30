const hookRegionSorter = () => {
  const regionSelect = document.getElementById("region-filter");
  if (regionSelect) {
    regionSelect.addEventListener("change", () => {
      const selectedRegion = regionSelect.value;
      const url = new URL(window.location.href);

      if (selectedRegion && selectedRegion !== "all") {
        url.searchParams.set("region", selectedRegion);
      } else {
        url.searchParams.delete("region");
      }

      window.location.href = url.toString();
    });
  }
};

const hookSeasonSorter = () => {
  const seasonSelect = document.getElementById("season-filter");
  if (seasonSelect) {
    seasonSelect.addEventListener("change", () => {
      const selectedSeason = seasonSelect.value;
      const url = new URL(window.location.href);

      if (selectedSeason && selectedSeason !== "all") {
        url.searchParams.set("season", selectedSeason);
      } else {
        url.searchParams.delete("season");
      }

      window.location.href = url.toString();
    });
  }
};

const loadTrainsCatalog = async () => {
  const listEl = document.getElementById("trains-list");
  const templateEl = document.getElementById("train-card-template");
  const loadingEl = document.getElementById("trains-loading");
  const errorEl = document.getElementById("trains-error");
  const emptyEl = document.getElementById("trains-empty");
  const pageInfoEl = document.getElementById("trains-page-info");
  const prevBtn = document.getElementById("trains-prev");
  const nextBtn = document.getElementById("trains-next");
  const paginationEl = document.querySelector(".trains-pagination");

  if (!listEl || !templateEl) {
    return;
  }

  if (loadingEl) {
    loadingEl.hidden = false;
  }

  const search = window.location.search ? window.location.search.slice(1) : "";

  try {
    const response = await fetch(`/api/trains${search ? `?${search}` : ""}`);
    if (!response.ok) {
      let message = `Failed to load trains (${response.status})`;
      try {
        const body = await response.json();
        if (body.error) {
          message = body.error;
        } else if (Array.isArray(body.errors) && body.errors.length > 0) {
          message = body.errors.map((e) => e.message).join(" ");
        }
      } catch (parseError) {
        // Keep the default message when the body is not JSON.
      }
      throw new Error(message);
    }

    const payload = await response.json();
    const trains = payload.data || [];
    const fragment = document.createDocumentFragment();

    trains.forEach((train) => {
      const card = templateEl.content.cloneNode(true);
      const imageEl = card.querySelector('[data-field="image"]');

      imageEl.src = train.imageUrl;
      imageEl.alt = train.imageAlt || `${train.name} train`;

      card.querySelector('[data-field="name"]').textContent = train.name;
      card.querySelector('[data-field="operator"]').textContent =
        train.operator;
      card.querySelector('[data-field="type"]').textContent = train.type;
      card.querySelector('[data-field="speed"]').textContent =
        `${train.maxSpeedKmh} km/h`;
      card.querySelector('[data-field="seats"]').textContent =
        `${train.capacity} seats`;
      card.querySelector('[data-field="power"]').textContent =
        train.powerSource;
      card.querySelector('[data-field="description"]').textContent =
        train.description;
      card.querySelector('[data-field="best-for"]').textContent = train.bestFor;

      fragment.appendChild(card);
    });

    listEl.replaceChildren(fragment);
    if (loadingEl) {
      loadingEl.hidden = true;
    }

    if (errorEl) {
      errorEl.hidden = true;
    }

    const pagination = payload.pagination || {};
    const totalPages = pagination.totalPages || 1;
    const currentPage = pagination.page || 1;

    const hasResults = trains.length > 0;

    if (emptyEl) {
      emptyEl.hidden = hasResults;
    }

    const showPagination = hasResults;
    if (paginationEl) {
      paginationEl.hidden = !showPagination;
    }

    if (showPagination) {
      if (pageInfoEl) {
        pageInfoEl.textContent = `Page ${currentPage} of ${totalPages}`;
      }

      if (prevBtn) {
        prevBtn.disabled = currentPage <= 1;
      }

      if (nextBtn) {
        nextBtn.disabled = !pagination.hasNextPage && currentPage >= totalPages;
      }
    }
  } catch (error) {
    if (loadingEl) {
      loadingEl.hidden = true;
    }
    if (errorEl) {
      errorEl.hidden = false;
      errorEl.textContent = error.message;
    }
    if (paginationEl) {
      paginationEl.hidden = true;
    }
  }
};

const goToTrainsPage = (page) => {
  const url = new URL(window.location.href);
  url.searchParams.set("page", String(page));
  window.location.href = url.toString();
};

// Update a single search/filter/sort parameter, drop the page number so the
// user always lands on page 1 of the new result set, then reload.
const applyTrainsParam = (name, value) => {
  const url = new URL(window.location.href);

  if (value === "" || value === null || value === undefined) {
    url.searchParams.delete(name);
  } else {
    url.searchParams.set(name, value);
  }

  url.searchParams.delete("page");
  window.location.href = url.toString();
};

// Reflect the current URL back into the toolbar controls so a shared/refreshed
// link shows the filters that are actually applied.
const syncTrainsControlsFromUrl = () => {
  const params = new URLSearchParams(window.location.search);

  const setIfPresent = (id, key) => {
    const el = document.getElementById(id);
    const value = params.get(key);
    if (el && value !== null) {
      el.value = value;
    }
  };

  setIfPresent("trains-search", "q");
  setIfPresent("trains-power", "powerSource");
  setIfPresent("trains-sort", "sort");
  setIfPresent("trains-order", "order");
};

const hookTrainsControls = () => {
  const searchEl = document.getElementById("trains-search");
  const powerEl = document.getElementById("trains-power");
  const sortEl = document.getElementById("trains-sort");
  const orderEl = document.getElementById("trains-order");

  if (powerEl) {
    powerEl.addEventListener("change", () => applyTrainsParam("powerSource", powerEl.value));
  }

  if (sortEl) {
    sortEl.addEventListener("change", () => applyTrainsParam("sort", sortEl.value));
  }

  if (orderEl) {
    orderEl.addEventListener("change", () => applyTrainsParam("order", orderEl.value));
  }

  if (searchEl) {
    let debounceTimer = null;
    const handleSearch = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => applyTrainsParam("q", searchEl.value.trim()), 300);
    };

    searchEl.addEventListener("input", handleSearch);
    searchEl.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        clearTimeout(debounceTimer);
        applyTrainsParam("q", searchEl.value.trim());
      }
    });
  }
};

const hookTrainsPagination = () => {
  const prevBtn = document.getElementById("trains-prev");
  const nextBtn = document.getElementById("trains-next");

  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      const params = new URLSearchParams(window.location.search);
      const page = Number(params.get("page") || "1") - 1;
      if (page >= 1) {
        goToTrainsPage(page);
      }
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      const params = new URLSearchParams(window.location.search);
      const page = Number(params.get("page") || "1") + 1;
      goToTrainsPage(page);
    });
  }
};

const hookTrainsCatalog = () => {
  syncTrainsControlsFromUrl();
  hookTrainsControls();
  hookTrainsPagination();
  loadTrainsCatalog();
};

const hookStationDetails = () => {
  const buttons = document.querySelectorAll(".station-details-btn");
  const templateEl = document.getElementById("station-details-template");

  if (!buttons.length || !templateEl) {
    return;
  }

  buttons.forEach((button) => {
    button.addEventListener("click", async () => {
      const stationId = button.dataset.stationId;
      const detailsEl = button.nextElementSibling;

      if (!stationId || !detailsEl) {
        return;
      }

      if (detailsEl.childElementCount > 0) {
        detailsEl.hidden = !detailsEl.hidden;
        button.textContent = detailsEl.hidden ? "View Station" : "Hide Station";
        return;
      }

      try {
        const response = await fetch(`/api/stations/${stationId}`);

        if (!response.ok) {
          detailsEl.hidden = false;
          detailsEl.textContent = "Unable to load station details.";
          button.textContent = "Hide Station";
          return;
        }

        const station = await response.json();
        const clone = templateEl.content.cloneNode(true);

        clone.querySelector('[data-field="name"]').textContent = station.name;
        clone.querySelector('[data-field="prefecture"]').textContent =
          station.prefecture;
        clone.querySelector('[data-field="region"]').textContent =
          station.region;
        clone.querySelector('[data-field="facilities"]').textContent = (
          station.facilities || []
        ).join(", ");
        clone.querySelector('[data-field="description"]').textContent =
          station.description;

        detailsEl.replaceChildren(clone);
        detailsEl.hidden = false;
        button.textContent = "Hide Station";
      } catch (error) {
        detailsEl.hidden = false;
        detailsEl.textContent = "Unable to load station details.";
        button.textContent = "Hide Station";
      }
    });
  });
};

const hookBookingsCatalog = () => {
  const listEl = document.getElementById("bookings-list");
  const cardTemplate = document.getElementById("booking-card-template");
  const editTemplate = document.getElementById("booking-edit-template");
  const loadingEl = document.getElementById("bookings-loading");
  const errorEl = document.getElementById("bookings-error");
  const emptyEl = document.getElementById("bookings-empty");
  const messageEl = document.getElementById("bookings-message");

  if (!listEl || !cardTemplate) {
    return;
  }

  let bookingsById = new Map();

  const setMessage = (text) => {
    if (!messageEl) return;
    if (!text) {
      messageEl.hidden = true;
      messageEl.textContent = "";
      return;
    }
    messageEl.hidden = false;
    messageEl.textContent = text;
  };

  const renderBookings = () => {
    if (loadingEl) loadingEl.hidden = true;

    if (bookingsById.size === 0) {
      listEl.replaceChildren();
      if (emptyEl) emptyEl.hidden = false;
      return;
    }

    if (emptyEl) emptyEl.hidden = true;
    const fragment = document.createDocumentFragment();

    for (const booking of bookingsById.values()) {
      const card = cardTemplate.content.cloneNode(true);
      const article = card.querySelector("[data-booking-id]");
      article.dataset.bookingId = booking.id;

      card.querySelector('[data-field="id"]').textContent = booking.id;
      card.querySelector('[data-field="created-at"]').textContent =
        booking.createdAt;
      card.querySelector('[data-field="schedule-id"]').textContent =
        booking.scheduleId;
      card.querySelector('[data-field="trip-id"]').textContent = booking.tripId;
      card.querySelector('[data-field="ticket-class"]').textContent =
        booking.ticketClass;
      card.querySelector('[data-field="selected-day"]').textContent =
        booking.selectedDay;

      const passengersEl = card.querySelector('[data-field="passengers"]');
      const passengers = Array.isArray(booking.passengers)
        ? booking.passengers
        : Object.values(booking.passengers || {});
      passengers.forEach((passenger) => {
        const li = document.createElement("li");
        li.textContent =
          `${passenger.firstName} ${passenger.lastName} — ` +
          `${passenger.email} — ${passenger.phone}`;
        passengersEl.appendChild(li);
      });

      fragment.appendChild(card);
    }

    listEl.replaceChildren(fragment);
  };

  const loadBookings = async () => {
    if (loadingEl) loadingEl.hidden = false;
    if (errorEl) errorEl.hidden = true;
    if (emptyEl) emptyEl.hidden = true;
    setMessage("");

    try {
      const response = await fetch("/api/bookings", {
        credentials: "same-origin",
      });

      if (response.status === 401) {
        window.location.href = "/login";
        return;
      }

      if (!response.ok) {
        throw new Error(`Failed to load bookings (${response.status})`);
      }

      const payload = await response.json();
      const bookings = payload.bookings || [];
      bookingsById = new Map(bookings.map((b) => [b.id, b]));
      renderBookings();
    } catch (error) {
      console.error("Error loading bookings:", error);
      if (loadingEl) loadingEl.hidden = true;
      if (errorEl) {
        errorEl.hidden = false;
        errorEl.textContent =
          "Unable to load bookings right now. Please try again in a moment.";
      }
    }
  };

  const showEditor = (card, booking) => {
    if (!editTemplate) return;

    const editor = editTemplate.content.cloneNode(true);
    const form = editor.querySelector("form");
    form.dataset.bookingId = booking.id;
    form.elements.scheduleId.value = booking.scheduleId || "";
    form.elements.tripId.value = booking.tripId || "";
    form.elements.ticketClass.value = booking.ticketClass || "";
    form.elements.selectedDay.value = booking.selectedDay || "";
    form.addEventListener("submit", saveBooking);
    card.replaceWith(editor);
    form.elements.scheduleId.focus();
  };

  async function saveBooking(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const bookingId = form.dataset.bookingId;
    const existing = bookingsById.get(bookingId) || {};

    const body = {
      scheduleId: form.elements.scheduleId.value.trim(),
      tripId: form.elements.tripId.value.trim(),
      ticketClass: form.elements.ticketClass.value.trim(),
      selectedDay: form.elements.selectedDay.value.trim(),
      passengers: existing.passengers,
      createdAt: existing.createdAt,
    };

    try {
      const response = await fetch(
        `/api/bookings/${encodeURIComponent(bookingId)}`,
        {
          method: "PUT",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );

      if (response.status === 401) {
        window.location.href = "/login";
        return;
      }

      if (!response.ok) {
        let err = {};
        try {
          err = await response.json();
        } catch {
          // body was empty or not JSON
        }
        setMessage(
          err.message ||
            `The booking could not be updated (${response.status})`,
        );
        return;
      }

      const payload = await response.json();
      bookingsById.set(payload.booking.id, payload.booking);
      renderBookings();
      setMessage(`Booking ${payload.booking.id} was updated.`);
    } catch (error) {
      console.error(error);
      setMessage("The booking could not be updated.");
    }
  }

  async function deleteBooking(booking) {
    if (!window.confirm(`Delete booking ${booking.id}?`)) {
      return;
    }

    try {
      const response = await fetch(
        `/api/bookings/${encodeURIComponent(booking.id)}`,
        {
          method: "DELETE",
          credentials: "same-origin",
        },
      );

      if (response.status === 401) {
        window.location.href = "/login";
        return;
      }

      if (!response.ok) {
        let err = {};
        try {
          err = await response.json();
        } catch {
          // body was empty or not JSON
        }
        setMessage(
          err.message ||
            `The booking could not be deleted (${response.status})`,
        );
        return;
      }

      bookingsById.delete(booking.id);
      renderBookings();
      setMessage(`Booking ${booking.id} was deleted.`);
    } catch (error) {
      console.error(error);
      setMessage("The booking could not be deleted.");
    }
  }

  listEl.addEventListener("click", async (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;

    if (button.dataset.action === "cancel") {
      renderBookings();
      return;
    }

    const card = button.closest("[data-booking-id]");
    if (!card) return;
    const booking = bookingsById.get(card.dataset.bookingId);
    if (!booking) return;

    if (button.dataset.action === "edit") {
      showEditor(card, booking);
    }
    if (button.dataset.action === "delete") {
      await deleteBooking(booking);
    }
  });

  loadBookings();
};

const hookMyBookings = async () => {
  const listEl = document.getElementById("my-bookings-list");
  const templateEl = document.getElementById("my-booking-card-template");
  const loadingEl = document.getElementById("my-bookings-loading");
  const errorEl = document.getElementById("my-bookings-error");
  const emptyEl = document.getElementById("my-bookings-empty");

  if (!listEl || !templateEl) {
    return;
  }

  try {
    const response = await fetch("/api/bookings/me");

    if (!response.ok) {
      throw new Error(`Failed to load bookings (${response.status})`);
    }

    const payload = await response.json();
    const bookings = payload.bookings || [];
    const fragment = document.createDocumentFragment();

    if (bookings.length === 0) {
      if (loadingEl) {
        loadingEl.hidden = true;
      }
      if (emptyEl) {
        emptyEl.hidden = false;
      }
      return;
    }

    bookings.forEach((booking) => {
      const card = templateEl.content.cloneNode(true);

      card.querySelector('[data-field="id"]').textContent = booking.id;
      card.querySelector('[data-field="created-at"]').textContent =
        booking.createdAt;
      card.querySelector('[data-field="trip-id"]').textContent = booking.tripId;
      card.querySelector('[data-field="ticket-class"]').textContent =
        booking.ticketClass;
      card.querySelector('[data-field="selected-day"]').textContent =
        booking.selectedDay;

      const passengersEl = card.querySelector('[data-field="passengers"]');
      const passengers = Array.isArray(booking.passengers)
        ? booking.passengers
        : Object.values(booking.passengers || {});
      passengers.forEach((passenger) => {
        const passengerEl = document.createElement("li");

        passengerEl.textContent =
          `${passenger.firstName} ${passenger.lastName} — ` +
          `${passenger.email} — ${passenger.phone}`;

        passengersEl.appendChild(passengerEl);
      });

      fragment.appendChild(card);
    });

    listEl.replaceChildren(fragment);

    if (loadingEl) {
      loadingEl.hidden = true;
    }
  } catch (error) {
    console.error("Error loading user's bookings:", error);

    if (loadingEl) {
      loadingEl.hidden = true;
    }

    if (errorEl) {
      errorEl.hidden = false;
      errorEl.textContent =
        "Unable to load your bookings right now. Please try again in a moment.";
    }
  }
};

document.addEventListener("DOMContentLoaded", () => {
  hookRegionSorter();
  hookSeasonSorter();
  hookTrainsCatalog();
  hookStationDetails();
  hookBookingsCatalog();
  hookMyBookings();
});
