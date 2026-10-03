    document.addEventListener('DOMContentLoaded', async () => {
        const PAGE_SIZE = 10;

        const grid = document.getElementById('routes-grid');
        const regionFilter = document.getElementById('region-filter');
        const seasonFilter = document.getElementById('season-filter');
        const paginationEl = document.getElementById('trips-pagination');
        const pageInfoEl = document.getElementById('trips-page-info');
        const prevBtn = document.getElementById('trips-prev');
        const nextBtn = document.getElementById('trips-next');

        let currentTrips = [];
        let pagination = {
            page: 1,
            limit: PAGE_SIZE,
            totalItems: 0,
            totalPages: 1,
            hasNextPage: false,
            hasPreviousPage: false
        };

        // 1. Check URL query parameters on load and sync the dropdowns
        const urlParams = new URLSearchParams(window.location.search);
        const regionParam = urlParams.get('region');
        const seasonParam = urlParams.get('season');

        if (regionParam) regionFilter.value = regionParam.toLowerCase();
        if (seasonParam) seasonFilter.value = seasonParam.toLowerCase();

        // Read the requested page from the URL, falling back to the first page
        const readPageFromUrl = () => {
            const requested = Number(new URLSearchParams(window.location.search).get('page'));
            return Number.isInteger(requested) && requested >= 1 ? requested : 1;
        };

        // Build a URL for the trips page that keeps the existing filter params
        const buildUrl = (page) => {
            const url = new URL(window.location.href);
            url.searchParams.set('page', String(page));
            url.searchParams.set('limit', String(PAGE_SIZE));
            return url;
        };

        // Fetch one page of trips from our API endpoint
        async function fetchTrips(page) {
            const params = new URLSearchParams();
            params.set('page', String(page));
            params.set('limit', String(PAGE_SIZE));

            try {
                const response = await fetch(`/api/trips?${params.toString()}`);
                if (!response.ok) throw new Error('Failed to fetch trips');

                const payload = await response.json();
                currentTrips = payload.data || [];
                pagination = payload.pagination || pagination;

                // Run filter immediately after fetching so it respects URL params on load
                filterTrips();
                updatePaginationControls();
            } catch (error) {
                console.error(error);
                hidePaginationControls();
                grid.innerHTML = '<p>Error loading trips data.</p>';
            }
        }

        // Render trips into HTML cards dynamically
        function renderTrips(trips) {
            if (trips.length === 0) {
                grid.innerHTML = '<p>No trips found.</p>';
                return;
            }

            grid.innerHTML = trips.map(trip => `
                <div class="route-card ${trip.region}">
                    <div class="route-header">
                        <h2 class="route-name">${trip.name || trip.title}</h2>
                        <span class="route-region">${trip.region}</span>
                    </div>

                    <div class="station-info">
                        <div class="station">
                            <div class="station-type">From:</div>
                            <div class="station-name">${trip.startStation || trip.from}</div>
                        </div>
                        <div class="route-arrow">&#8594;</div>
                        <div class="station">
                            <div class="station-type">To:</div>
                            <div class="station-name">${trip.endStation || trip.to}</div>
                        </div>
                    </div>

                    <div class="route-details">
                        <div class="detail-item">
                            <span class="detail-icon">&#128337;</span>
                            <span><span class="detail-label">Duration:</span> ${trip.duration || trip.travelTime || trip.time}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-icon">&#128205;</span>
                            <span><span class="detail-label">Distance:</span> ${trip.distance}km</span>
                        </div>
                        <div class="detail-item">
                            <span class="season-badge season-${trip.bestSeason || trip.season}">
                                Best in ${trip.bestSeason || trip.season}
                            </span>
                        </div>
                    </div>

                    <div class="route-description">
                        ${trip.description}
                    </div>

                    <div class="highlights">
                        <div class="highlights-list">
                            ${(trip.highlights || []).map(h => `<span class="highlight-tag">${h}</span>`).join('')}
                        </div>
                    </div>

                    <div class="route-actions">
                         <a href="/trips/${trip.id || trip._id}" class="view-details-btn">
                            View Details &amp; Book &#8594;
                        </a>
                    </div>
                </div>
            `).join('');
        }

        // Filter capability with clean URL history updates (no page reload)
        function filterTrips() {
            const selectedRegion = regionFilter.value;
            const selectedSeason = seasonFilter.value;

            // Update URL query string smoothly without reloading the page
            const params = new URLSearchParams();
            if (selectedRegion !== 'all') params.set('region', selectedRegion);
            if (selectedSeason !== 'all') params.set('season', selectedSeason);
            params.set('page', String(pagination.page));
            params.set('limit', String(PAGE_SIZE));
            const newPath = window.location.pathname + '?' + params.toString();
            history.pushState(null, '', newPath);

            const filtered = currentTrips.filter(trip => {
                const regionVal = trip.region ? trip.region.trim().toLowerCase() : '';
                const seasonVal = (trip.bestSeason || trip.season) ? (trip.bestSeason || trip.season).trim().toLowerCase() : '';

                const matchesRegion = selectedRegion === 'all' || regionVal === selectedRegion;
                const matchesSeason = selectedSeason === 'all' || seasonVal === selectedSeason;
                return matchesRegion && matchesSeason;
            });

            renderTrips(filtered);
        }

        // Reflect the server pagination metadata in the controls
        function updatePaginationControls() {
            if (!paginationEl) return;

            const totalPages = pagination.totalPages || 1;
            const currentPage = pagination.page || 1;

            if (pageInfoEl) {
                pageInfoEl.textContent = `Page ${currentPage} of ${totalPages}`;
            }

            if (prevBtn) {
                prevBtn.disabled = currentPage <= 1;
            }

            if (nextBtn) {
                nextBtn.disabled = !pagination.hasNextPage;
            }

            paginationEl.hidden = false;
        }

        function hidePaginationControls() {
            if (paginationEl) {
                paginationEl.hidden = true;
            }
        }

        // Move to another page without a full reload
        function goToPage(page) {
            const url = buildUrl(page);
            history.pushState(null, '', url.toString());
            fetchTrips(page);
        }

        prevBtn.addEventListener('click', () => {
            if (pagination.hasPreviousPage) {
                goToPage(pagination.page - 1);
            }
        });

        nextBtn.addEventListener('click', () => {
            if (pagination.hasNextPage) {
                goToPage(pagination.page + 1);
            }
        });

        regionFilter.addEventListener('change', filterTrips);
        seasonFilter.addEventListener('change', filterTrips);

        // Support browser back/forward between visited pages
        window.addEventListener('popstate', () => {
            fetchTrips(readPageFromUrl());
        });

        // Load the requested page of data on page load
        fetchTrips(readPageFromUrl());
    });
