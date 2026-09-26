document.addEventListener('DOMContentLoaded', () => {
    const tableBody = document.getElementById('trip-table-body');
    const editContainer = document.getElementById('edit-form-container');
    const tripForm = document.getElementById('trip-form');
    const tripIdInput = document.getElementById('trip-id');
    const tripNameInput = document.getElementById('trip-name');
    const startStationSelect = document.getElementById('startStation');
    const endStationSelect = document.getElementById('endStation');
    const scheduleSelect = document.getElementById('scheduleId');
    const cancelBtn = document.getElementById('cancel-edit');

    const dataEl = document.getElementById('admin-trips-data');
    let referenceData = { stations: [], schedules: [] };
    if (dataEl) {
        try {
            referenceData = JSON.parse(dataEl.textContent);
        } catch (error) {
            console.error('Error parsing admin trips reference data:', error);
        }
    }

    const stations = Array.isArray(referenceData.stations) ? referenceData.stations : [];
    const schedules = Array.isArray(referenceData.schedules) ? referenceData.schedules : [];
    let trips = [];

    const stationName = (id) => {
        const station = stations.find((stationItem) => String(stationItem.id) === String(id));
        return station ? station.name : String(id || 'N/A');
    };

    const scheduleLabel = (schedule) => {
        const departure = schedule.departureTime || '?';
        const arrival = schedule.arrivalTime || '?';
        return `#${schedule.id}: ${departure} - ${arrival}`;
    };

    const schedulesForTrip = (tripId) => {
        return schedules.filter((schedule) => String(schedule.tripId) === String(tripId));
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
        const row = document.createElement('tr');
        const cell = document.createElement('td');
        cell.colSpan = 5;
        cell.textContent = message;
        row.appendChild(cell);
        tableBody.appendChild(row);
    };

    const renderTrips = (items) => {
        trips = items;
        tableBody.replaceChildren();

        if (!items.length) {
            setTableMessage('No trips found.');
            return;
        }

        items.forEach((trip) => {
            const row = document.createElement('tr');
            const nameCell = document.createElement('td');
            const startCell = document.createElement('td');
            const endCell = document.createElement('td');
            const scheduleCell = document.createElement('td');
            const actionsCell = document.createElement('td');
            const editButton = document.createElement('button');
            const deleteButton = document.createElement('button');
            const tripSchedules = schedulesForTrip(trip.id);

            nameCell.textContent = trip.name || trip.title || 'Untitled';
            startCell.textContent = stationName(trip.startStation);
            endCell.textContent = stationName(trip.endStation);
            scheduleCell.textContent = tripSchedules.length
                ? tripSchedules.map(scheduleLabel).join('; ')
                : 'No schedule assigned';

            editButton.type = 'button';
            editButton.dataset.action = 'edit';
            editButton.dataset.id = String(trip.id);
            editButton.textContent = 'Edit';

            deleteButton.type = 'button';
            deleteButton.dataset.action = 'delete';
            deleteButton.dataset.id = String(trip.id);
            deleteButton.className = 'danger';
            deleteButton.textContent = 'Delete';

            actionsCell.append(editButton, deleteButton);
            row.append(nameCell, startCell, endCell, scheduleCell, actionsCell);
            tableBody.appendChild(row);
        });
    };

    const loadTrips = async () => {
        try {
            const response = await fetch('/api/trips');
            if (response.status === 401) {
                window.location.assign('/login');
                return;
            }
            if (!response.ok) {
                throw new Error('Failed to fetch trips');
            }

            const data = await response.json();
            renderTrips(Array.isArray(data) ? data : (data.trips || []));
        } catch (error) {
            console.error('Error fetching trips:', error);
            setTableMessage('Error loading trips data.');
        }
    };

    const openEditor = (trip) => {
        const tripSchedules = schedulesForTrip(trip.id);
        tripIdInput.value = String(trip.id);
        tripNameInput.value = trip.name || trip.title || '';
        startStationSelect.value = String(trip.startStation || '');
        endStationSelect.value = String(trip.endStation || '');
        scheduleSelect.value = tripSchedules.length ? String(tripSchedules[0].id) : '';
        editContainer.hidden = false;
        editContainer.scrollIntoView({ behavior: 'smooth' });
    };

    const deleteTrip = async (id) => {
        if (!window.confirm('Are you sure you want to delete this trip?')) {
            return;
        }

        try {
            const response = await fetch(`/api/trips/${id}`, { method: 'DELETE' });
            if (response.status === 401) {
                window.location.assign('/login');
                return;
            }
            if (!response.ok) {
                alert(await getErrorMessage(response, 'Failed to delete trip.'));
                return;
            }

            await loadTrips();
        } catch (error) {
            console.error('Delete error:', error);
            alert('Failed to delete trip.');
        }
    };

    tableBody.addEventListener('click', (event) => {
        const button = event.target.closest('button[data-action]');
        if (!button) {
            return;
        }

        const trip = trips.find((item) => String(item.id) === button.dataset.id);
        if (!trip) {
            return;
        }

        if (button.dataset.action === 'delete') {
            deleteTrip(trip.id);
            return;
        }

        openEditor(trip);
    });

    cancelBtn.addEventListener('click', () => {
        tripForm.reset();
        scheduleSelect.value = '';
        editContainer.hidden = true;
    });

    tripForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const id = tripIdInput.value;
        const payload = {
            name: tripNameInput.value,
            startStation: startStationSelect.value,
            endStation: endStationSelect.value
        };

        if (scheduleSelect.value) {
            payload.scheduleId = scheduleSelect.value;
        }

        try {
            const response = await fetch(`/api/trips/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (response.status === 401) {
                window.location.assign('/login');
                return;
            }
            if (!response.ok) {
                alert(await getErrorMessage(response, 'Failed to update trip.'));
                return;
            }

            tripForm.reset();
            scheduleSelect.value = '';
            editContainer.hidden = true;
            await loadTrips();
        } catch (error) {
            console.error('Update error:', error);
            alert('Failed to update trip.');
        }
    });

    loadTrips();
});