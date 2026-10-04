// Trips Admin page controller
// Fetches paginated + filtered trip data from /api/trips and renders
// the admin table, filter bar, pagination controls, and edit form.

document.addEventListener("DOMContentLoaded", () => {
  // --- DOM references ---
  // Cached once at page load. Every element this page manipulates is
  // looked up here so the rest of the code doesn't hit the DOM repeatedly.
  const tableBody = document.getElementById("trip-table-body");
  const editContainer = document.getElementById("edit-form-container");
  const tripForm = document.getElementById("trip-form");
  const tripIdInput = document.getElementById("trip-id");
  const tripNameInput = document.getElementById("trip-name");
  const startStationSelect = document.getElementById("startStation");
  const endStationSelect = document.getElementById("endStation");
  const scheduleSelect = document.getElementById("scheduleId");
  const cancelBtn = document.getElementById("cancel-edit");
  const paginationEl = document.getElementById("trips-pagination");
  const prevBtn = document.getElementById("trips-prev");
  const nextBtn = document.getElementById("trips-next");
  const pageInfoEl = document.getElementById("trips-page-info");
  const regionSelect = document.getElementById("filter-region");
  const seasonSelect = document.getElementById("filter-season");
  const searchInput = document.getElementById("filter-search");
  const clearButton = document.getElementById("filter-clear");

  // Page size must match what the API is asked for. 10 was chosen
  // by the assignment spec.
  const PAGE_SIZE = 10;

  // How long to wait after the user stops typing before sending
  // a search request. Prevents a request per keystroke.
  const SEARCH_DEBOUNCE_MS = 300;

  // --- Reference data (stations + schedules) ---
  // The server embeds stations and schedules as JSON in the page so the
  // client can map station ids to names and show schedule options without
  // extra requests. It is parsed defensively so a malformed blob
  // doesn't break the whole page.
  const dataEl = document.getElementById("admin-trips-data");
  let referenceData = { stations: [], schedules: [] };
  if (dataEl) {
    try {
      referenceData = JSON.parse(dataEl.textContent);
    } catch (error) {
      console.error("Error parsing admin trips reference data:", error);
    }
  }

  const stations = Array.isArray(referenceData.stations)
    ? referenceData.stations
    : [];
  let schedules = Array.isArray(referenceData.schedules)
    ? referenceData.schedules
    : [];
  let trips = [];
  let pagination = null;

  // --- URL state helpers ---
  // Filters and the current page live in the URL so a view can be
  // refreshed, bookmarked, or shared and still show the same results.

  const getPageFromUrl = () => {
    const params = new URLSearchParams(window.location.search);
    const parsed = Number(params.get("page"));
    return Number.isInteger(parsed) && parsed >= 1 ? parsed : 1;
  };

  const getFiltersFromUrl = () => {
    const params = new URLSearchParams(window.location.search);
    return {
      region: params.get("region") || "",
      season: params.get("season") || "",
      q: params.get("q") || "",
    };
  };

  let currentPage = getPageFromUrl();
  let currentFilters = getFiltersFromUrl();

  // Keeps the dropdowns and search box in sync with whatever is
  // currently in the URL (used on load and on browser back/forward).
  const applyFiltersToControls = (filters) => {
    regionSelect.value = filters.region;
    seasonSelect.value = filters.season;
    searchInput.value = filters.q;
  };

  // Writes the page and filter values into the URL. `pushState` adds a
  // history entry (so Back works); `replaceState` updates the current
  // entry without adding a new one (used when the server returns a
  // corrected page number, for example).
  const updateUrl = (page, filters, usePush) => {
    const url = new URL(window.location.href);
    const setOrDelete = (key, value) => {
      if (value) {
        url.searchParams.set(key, value);
      } else {
        url.searchParams.delete(key);
      }
    };
    setOrDelete("page", page > 1 ? String(page) : "");
    setOrDelete("region", filters.region);
    setOrDelete("season", filters.season);
    setOrDelete("q", filters.q);

    if (usePush) {
      history.pushState(null, "", url.toString());
    } else {
      history.replaceState(null, "", url.toString());
    }
  };

  // Used to decide which empty-state message to show: "no trips at all"
  // vs "no trips match your filters".
  const hasActiveFilters = () =>
    Boolean(currentFilters.region || currentFilters.season || currentFilters.q);

  // --- Lookup helpers ---
  const stationName = (id) => {
    const station = stations.find(
      (stationItem) => String(stationItem.id) === String(id),
    );
    return station ? station.name : String(id || "N/A");
  };

  const scheduleLabel = (schedule) => {
    const departure = schedule.departureTime || "?";
    const arrival = schedule.arrivalTime || "?";
    return `#${schedule.id}: ${departure} - ${arrival}`;
  };

  const schedulesForTrip = (tripId) => {
    return schedules.filter(
      (schedule) => String(schedule.tripId) === String(tripId),
    );
  };

  const scheduleOptionLabel = (schedule) => {
    const departure = schedule.departureTime || "?";
    const arrival = schedule.arrivalTime || "?";
    return `${departure} - ${arrival} (Trip: ${schedule.tripId})`;
  };

  // --- Schedule fetching and rendering ---
  // Schedules are refreshed on every load so the edit form always has
  // current schedule options, even after a teammate reassigns one.
  const fetchSchedules = async () => {
    try {
      const response = await fetch("/api/schedules");
      if (!response.ok) {
        return null;
      }
      const data = await response.json();
      return Array.isArray(data) ? data : data.schedules || [];
    } catch (error) {
      console.error("Error fetching schedules:", error);
      return null;
    }
  };

  const renderScheduleOptions = (items, selectedId) => {
    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "No schedule change";
    scheduleSelect.replaceChildren(placeholder);

    items.forEach((schedule) => {
      const option = document.createElement("option");
      option.value = String(schedule.id);
      option.textContent = scheduleOptionLabel(schedule);
      scheduleSelect.appendChild(option);
    });

    scheduleSelect.value = selectedId || "";
  };

  // Safely extract an error message from an API response. Falls back
  // to the caller's default if the body is missing or not JSON.
  const getErrorMessage = async (response, fallback) => {
    try {
      const data = await response.json();
      return data.error || data.message || fallback;
    } catch (error) {
      return fallback;
    }
  };

  // Renders a single-row message inside the table (for loading,
  // empty, or error states). Using textContent keeps user-supplied
  // values as text, so no HTML injection is possible.
  const setTableMessage = (message) => {
    tableBody.replaceChildren();
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 5;
    cell.textContent = message;
    row.appendChild(cell);
    tableBody.appendChild(row);
  };

  // Builds one table row per trip using safe DOM methods (createElement
  // + textContent) instead of innerHTML, so trip names or descriptions
  // cannot inject markup.
  const renderTrips = (items) => {
    trips = items;
    tableBody.replaceChildren();

    if (!items.length) {
      setTableMessage(
        hasActiveFilters() ? "No trips match your filters." : "No trips found.",
      );
      return;
    }

    items.forEach((trip) => {
      const row = document.createElement("tr");
      const nameCell = document.createElement("td");
      const startCell = document.createElement("td");
      const endCell = document.createElement("td");
      const scheduleCell = document.createElement("td");
      const actionsCell = document.createElement("td");
      const editButton = document.createElement("button");
      const deleteButton = document.createElement("button");
      const tripSchedules = schedulesForTrip(trip.id);

      nameCell.textContent = trip.name || trip.title || "Untitled";
      startCell.textContent = stationName(trip.startStation);
      endCell.textContent = stationName(trip.endStation);
      scheduleCell.textContent = tripSchedules.length
        ? tripSchedules.map(scheduleLabel).join("; ")
        : "No schedule assigned";

      editButton.type = "button";
      editButton.dataset.action = "edit";
      editButton.dataset.id = String(trip.id);
      editButton.textContent = "Edit";

      deleteButton.type = "button";
      deleteButton.dataset.action = "delete";
      deleteButton.dataset.id = String(trip.id);
      deleteButton.className = "danger";
      deleteButton.textContent = "Delete";

      actionsCell.append(editButton, deleteButton);
      row.append(nameCell, startCell, endCell, scheduleCell, actionsCell);
      tableBody.appendChild(row);
    });
  };

  // Updates the Previous / Next buttons and the page indicator from the
  // pagination metadata returned by the API.
  // Special case: when totalItems is 0, show "No results" instead of
  // "Page 1 of 0" (which would be confusing).
  const updatePaginationControls = () => {
    if (!paginationEl) {
      return;
    }
    if (!pagination || pagination.totalItems === 0) {
      paginationEl.hidden = false;
      pageInfoEl.textContent = "No results";
      prevBtn.disabled = true;
      nextBtn.disabled = true;
      return;
    }
    paginationEl.hidden = false;
    pageInfoEl.textContent = `Page ${pagination.page} of ${pagination.totalPages}`;
    prevBtn.disabled = !pagination.hasPreviousPage;
    nextBtn.disabled = !pagination.hasNextPage;
  };

  // --- Main data load ---
  // Fetches one page of trips (with active filters applied) and one
  // list of schedules in parallel. Uses the API's pagination metadata
  // to drive the page indicator and button state.
  const loadTrips = async (page = currentPage, selectedScheduleId = "") => {
    try {
      // Build the query string. Filters are only added when set, so
      // the URL stays short for the common unfiltered case.
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(PAGE_SIZE));
      if (currentFilters.region) params.set("region", currentFilters.region);
      if (currentFilters.season) params.set("season", currentFilters.season);
      if (currentFilters.q) params.set("q", currentFilters.q);

      const [tripsResponse, freshSchedules] = await Promise.all([
        fetch(`/api/trips?${params.toString()}`),
        fetchSchedules(),
      ]);

      // 401 means the session expired. Send the user to login.
      if (tripsResponse.status === 401) {
        window.location.assign("/login");
        return;
      }

      // 404 from this endpoint means "page past the last page". If the
      // user was on a later page (e.g. they deleted trips and now the
      // page is empty), fall back one page and retry.
      if (tripsResponse.status === 404) {
        if (page > 1) {
          const fallback = page - 1;
          currentPage = fallback;
          updateUrl(fallback, currentFilters, false);
          await loadTrips(fallback, selectedScheduleId);
          return;
        }
        setTableMessage("No trips found.");
        pagination = null;
        updatePaginationControls();
        return;
      }

      // 400 means an invalid page, limit, or filter value was sent.
      if (tripsResponse.status === 400) {
        setTableMessage("Invalid filter or page request.");
        pagination = null;
        updatePaginationControls();
        return;
      }

      if (!tripsResponse.ok) {
        throw new Error("Failed to fetch trips");
      }

      const data = await tripsResponse.json();

      if (Array.isArray(freshSchedules)) {
        schedules = freshSchedules;
        renderScheduleOptions(schedules, selectedScheduleId);
      }

      // The API returns { data, pagination }. Using the response's own
      // page value keeps the client aligned with what the server
      // actually returned (for example, after a fallback).
      trips = Array.isArray(data.data) ? data.data : [];
      pagination = data.pagination || null;
      currentPage = pagination ? pagination.page : page;
      updateUrl(currentPage, currentFilters, false);
      renderTrips(trips);
      updatePaginationControls();
    } catch (error) {
      console.error("Error fetching trips:", error);
      setTableMessage("Error loading trips data.");
      pagination = null;
      updatePaginationControls();
    }
  };

  // --- Edit form ---
  const openEditor = (trip) => {
    const tripSchedules = schedulesForTrip(trip.id);
    tripIdInput.value = String(trip.id);
    tripNameInput.value = trip.name || trip.title || "";
    startStationSelect.value = String(trip.startStation || "");
    endStationSelect.value = String(trip.endStation || "");
    scheduleSelect.value = tripSchedules.length
      ? String(tripSchedules[0].id)
      : "";
    editContainer.hidden = false;
    editContainer.scrollIntoView({ behavior: "smooth" });
  };

  const deleteTrip = async (id) => {
    if (!window.confirm("Are you sure you want to delete this trip?")) {
      return;
    }

    try {
      const response = await fetch(`/api/trips/${id}`, { method: "DELETE" });
      if (response.status === 401) {
        window.location.assign("/login");
        return;
      }
      if (!response.ok) {
        alert(await getErrorMessage(response, "Failed to delete trip."));
        return;
      }

      // Reload the current page so the deleted row disappears. If the
      // page is now empty, the 404 fallback in loadTrips will step back.
      await loadTrips(currentPage);
    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed to delete trip.");
    }
  };

  // --- Filter handling ---
  // Called whenever a filter control changes. Resets to page 1 because
  // narrowing the result set can push the current page past the end.
  // pushState is used so Back returns to the previous filter state.
  const applyFilterChange = () => {
    currentFilters = {
      region: regionSelect.value,
      season: seasonSelect.value,
      q: searchInput.value.trim(),
    };
    currentPage = 1;
    updateUrl(1, currentFilters, true);
    loadTrips(1);
  };

  // --- Event listeners ---
  // Edit/Delete buttons are handled with one listener on the table body
  // (event delegation), so listeners survive every table re-render.
  tableBody.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) {
      return;
    }

    const trip = trips.find((item) => String(item.id) === button.dataset.id);
    if (!trip) {
      return;
    }

    if (button.dataset.action === "delete") {
      deleteTrip(trip.id);
      return;
    }

    openEditor(trip);
  });

  cancelBtn.addEventListener("click", () => {
    tripForm.reset();
    scheduleSelect.value = "";
    editContainer.hidden = true;
  });

  tripForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const id = tripIdInput.value;
    const payload = {
      name: tripNameInput.value,
      startStation: startStationSelect.value,
      endStation: endStationSelect.value,
    };

    if (scheduleSelect.value) {
      payload.scheduleId = scheduleSelect.value;
    }

    try {
      const response = await fetch(`/api/trips/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (response.status === 401) {
        window.location.assign("/login");
        return;
      }
      if (!response.ok) {
        alert(await getErrorMessage(response, "Failed to update trip."));
        return;
      }

      const selectedScheduleId = scheduleSelect.value;
      tripForm.reset();
      scheduleSelect.value = "";
      editContainer.hidden = true;
      await loadTrips(currentPage, selectedScheduleId);
    } catch (error) {
      console.error("Update error:", error);
      alert("Failed to update trip.");
    }
  });

  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      if (pagination && pagination.hasPreviousPage) {
        loadTrips(currentPage - 1);
      }
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      if (pagination && pagination.hasNextPage) {
        loadTrips(currentPage + 1);
      }
    });
  }

  // Dropdowns apply filters immediately.
  regionSelect.addEventListener("change", applyFilterChange);
  seasonSelect.addEventListener("change", applyFilterChange);

  // Search box is debounced: each keystroke resets a short timer, and
  // the request fires only after the user pauses typing.
  let searchTimer = null;
  searchInput.addEventListener("input", () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(applyFilterChange, SEARCH_DEBOUNCE_MS);
  });

  // Clear resets every control and re-fetches page 1 with no filters.
  clearButton.addEventListener("click", () => {
    regionSelect.value = "";
    seasonSelect.value = "";
    searchInput.value = "";
    applyFilterChange();
  });

  // Browser back / forward: re-read the URL and restore the state
  // before fetching.
  window.addEventListener("popstate", () => {
    currentFilters = getFiltersFromUrl();
    currentPage = getPageFromUrl();
    applyFiltersToControls(currentFilters);
    loadTrips(currentPage);
  });

  // --- Initial load ---
  // Restore controls from the URL (supports refresh and shared links)
  // then fetch the first page.
  applyFiltersToControls(currentFilters);
  loadTrips(currentPage);
});