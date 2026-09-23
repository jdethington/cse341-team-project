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

document.addEventListener("DOMContentLoaded", () => {
  hookRegionSorter();
  hookSeasonSorter();
  hookTrainsCatalog();
  hookStationDetails();
});
