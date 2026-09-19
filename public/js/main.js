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

const hookTrainsCatalog = async () => {
  const listEl = document.getElementById("trains-list");
  const templateEl = document.getElementById("train-card-template");
  const loadingEl = document.getElementById("trains-loading");
  const errorEl = document.getElementById("trains-error");

  if (!listEl || !templateEl) {
    return;
  }

  try {
    const response = await fetch("/api/trains");
    if (!response.ok) {
      throw new Error(`Failed to load trains (${response.status})`);
    }

    const payload = await response.json();
    const trains = payload.trains || [];
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
  } catch (error) {
    if (loadingEl) {
      loadingEl.hidden = true;
    }
    if (errorEl) {
      errorEl.hidden = false;
      errorEl.textContent =
        "Unable to load trains right now. Please try again in a moment.";
    }
  }
};

const hookBookingsCatalog = async () => {
  const listEl = document.getElementById("bookings-list");
  const templateEl = document.getElementById("booking-card-template");
  const loadingEl = document.getElementById("bookings-loading");
  const errorEl = document.getElementById("bookings-error");
  const emptyEl = document.getElementById("bookings-empty");

  if (!listEl || !templateEl) {
    return;
  }

  try {
    const response = await fetch("/api/bookings");

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
      card.querySelector('[data-field="schedule-id"]').textContent =
        booking.scheduleId;
      card.querySelector('[data-field="trip-id"]').textContent = booking.tripId;
      card.querySelector('[data-field="ticket-class"]').textContent =
        booking.ticketClass;
      card.querySelector('[data-field="selected-day"]').textContent =
        booking.selectedDay;

      const passengersEl = card.querySelector('[data-field="passengers"]');

      booking.passengers.forEach((passenger) => {
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
    console.error("Error loading bookings:", error);

    if (loadingEl) {
      loadingEl.hidden = true;
    }

    if (errorEl) {
      errorEl.hidden = false;
      errorEl.textContent =
        "Unable to load bookings right now. Please try again in a moment.";
    }
  }
};

document.addEventListener("DOMContentLoaded", () => {
  hookRegionSorter();
  hookSeasonSorter();
  hookTrainsCatalog();
  hookBookingsCatalog();
});
