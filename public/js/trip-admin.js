document.addEventListener("DOMContentLoaded", () => {
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

  const PAGE_SIZE = 10;

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

  const getPageFromUrl = () => {
    const params = new URLSearchParams(window.location.search);
    const parsed = Number(params.get("page"));
    return Number.isInteger(parsed) && parsed >= 1 ? parsed : 1;
  };

  const setPageInUrl = (page) => {
    const url = new URL(window.location.href);
    if (page > 1) {
      url.searchParams.set("page", String(page));
    } else {
      url.searchParams.delete("page");
    }
    history.replaceState(null, "", url.toString());
  };

  let currentPage = getPageFromUrl();

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

  const getErrorMessage = async (response, fallback) => {
    try {
      const data = await response.json();
      return data.error || data.message || fallback;
    } catch (error) {
      return fallback;
    }
  };

  const setTableMessage = (message) => {
    tableBody.replaceChildren();
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 5;
    cell.textContent = message;
    row.appendChild(cell);
    tableBody.appendChild(row);
  };

  const renderTrips = (items) => {
    trips = items;
    tableBody.replaceChildren();

    if (!items.length) {
      setTableMessage("No trips found.");
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

  const updatePaginationControls = () => {
    if (!paginationEl) {
      return;
    }
    if (!pagination) {
      paginationEl.hidden = true;
      return;
    }
    paginationEl.hidden = false;
    pageInfoEl.textContent = `Page ${pagination.page} of ${pagination.totalPages}`;
    prevBtn.disabled = !pagination.hasPreviousPage;
    nextBtn.disabled = !pagination.hasNextPage;
  };

  const loadTrips = async (page = currentPage, selectedScheduleId = "") => {
    try {
      const [tripsResponse, freshSchedules] = await Promise.all([
        fetch(`/api/trips?page=${page}&limit=${PAGE_SIZE}`),
        fetchSchedules(),
      ]);

      if (tripsResponse.status === 401) {
        window.location.assign("/login");
        return;
      }

      if (tripsResponse.status === 404) {
        if (page > 1) {
          const fallback = page - 1;
          currentPage = fallback;
          setPageInUrl(fallback);
          await loadTrips(fallback, selectedScheduleId);
          return;
        }
        setTableMessage("No trips found.");
        pagination = null;
        updatePaginationControls();
        return;
      }

      if (tripsResponse.status === 400) {
        setTableMessage("Invalid page request.");
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

      trips = Array.isArray(data.data) ? data.data : [];
      pagination = data.pagination || null;
      currentPage = pagination ? pagination.page : page;
      setPageInUrl(currentPage);
      renderTrips(trips);
      updatePaginationControls();
    } catch (error) {
      console.error("Error fetching trips:", error);
      setTableMessage("Error loading trips data.");
      pagination = null;
      updatePaginationControls();
    }
  };

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

      await loadTrips(currentPage);
    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed to delete trip.");
    }
  };

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

  loadTrips(currentPage);
});
