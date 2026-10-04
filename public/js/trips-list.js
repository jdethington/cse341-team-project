    document.addEventListener('DOMContentLoaded', async () => {
        const PAGE_SIZE = 10;

        const grid = document.getElementById('routes-grid');
        const regionFilter = document.getElementById('region-filter');
        const seasonFilter = document.getElementById('season-filter');
        const searchInput = document.getElementById('search-input');
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

        const qParam = urlParams.get('q');

        if (regionParam) regionFilter.value = regionParam.toLowerCase();
        if (seasonParam) seasonFilter.value = seasonParam.toLowerCase();
        if (searchInput && qParam) searchInput.value = qParam;

        // Read the requested page from the URL, falling back to the first page
        const readPageFromUrl = () => {
            const requested = Number(new URLSearchParams(window.location.search).get('page'));
            return Number.isInteger(requested) && requested >= 1 ? requested : 1;
        };

        // Read the current filter selections straight from the controls
        const readFilters = () => ({
            region: regionFilter.value,
            season: seasonFilter.value,
            q: searchInput ? searchInput.value.trim() : ''
        });

        // Build the browser URL so the active filters stay shareable and the
        // back button can restore them.
        const buildPageUrl = (page, filters) => {
            const url = new URL(window.location.href);

            if (filters.region !== 'all') url.searchParams.set('region', filters.region);
            else url.searchParams.delete('region');

            if (filters.season !== 'all') url.searchParams.set('season', filters.season);
            else url.searchParams.delete('season');

            if (filters.q) url.searchParams.set('q', filters.q);
            else url.searchParams.delete('q');

            url.searchParams.set('page', String(page));
            url.searchParams.set('limit', String(PAGE_SIZE));
            return url;
        };

        // Build the API request URL. This must target /api/trips, not the page.
        const buildApiUrl = (page, filters) => {
            const params = new URLSearchParams();

            params.set('page', String(page));
            params.set('limit', String(PAGE_SIZE));

            if (filters.region !== 'all') params.set('region', filters.region);
            if (filters.season !== 'all') params.set('season', filters.season);
            if (filters.q) params.set('q', filters.q);

            return `/api/trips?${params.toString()}`;
        };

        // Fetch one page of trips from our API endpoint
        async function fetchTrips(page, filters) {
            const activeFilters = filters || readFilters();
            const apiUrl = buildApiUrl(page, activeFilters);

            try {
                const response = await fetch(apiUrl, {
                    headers: { Accept: 'application/json' }
                });

                if (!response.ok) {
                    if (response.status === 404) {
                        // The requested page is past the last page: fall back to
                        // the last page that does have results.
                        let lastPage = 0;

                        try {
                            const payload = await response.json();
                            lastPage = payload?.pagination?.totalPages || 0;
                        } catch {
                            lastPage = 0;
                        }

                        const error = new Error('Page out of range');
                        error.fallbackPage = lastPage > 0 && lastPage < page ? lastPage : 1;
                        throw error;
                    }
                    throw new Error(`Failed to fetch trips (${response.status})`);
                }

                const payload = await response.json();
                currentTrips = payload.data || [];
                pagination = payload.pagination || pagination;

                renderTrips(currentTrips);
                updatePaginationControls();
            } catch (error) {
                // A stale page after narrowing filters should self-correct
                // instead of showing a hard error.
                if (error.fallbackPage) {
                    const fallbackUrl = buildPageUrl(error.fallbackPage, activeFilters);
                    history.replaceState(null, '', fallbackUrl.toString());
                    await fetchTrips(error.fallbackPage, activeFilters);
                    return;
                }

                console.error(error);
                hidePaginationControls();
                grid.innerHTML = '<p>Error loading trips data.</p>';
            }
        }

        // Render trips into HTML cards dynamically
        function renderTrips(trips) {
            if (trips.length === 0) {
                const hasActiveQuery = pagination.totalItems === 0 && (
                    regionFilter.value !== 'all' ||
                    seasonFilter.value !== 'all' ||
                    (searchInput && searchInput.value.trim())
                );

                grid.innerHTML = hasActiveQuery
                    ? '<p>No trips match your filters.</p>'
                    : '<p>No trips found.</p>';
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

        // Filtering happens on the server so the result set is paginated. Any
        // filter change restarts at page 1, since narrowing can push the old
        // page number past the end of the results.
        function applyFilters() {
            const filters = readFilters();
            const url = buildPageUrl(1, filters);
            history.pushState(null, '', url.toString());
            fetchTrips(1, filters);
        }

        // Debounce keyword typing so we do not query on every keystroke.
        function debounce(callback, wait) {
            let timer;
            return (...args) => {
                clearTimeout(timer);
                timer = setTimeout(() => callback(...args), wait);
            };
        }

        // Reflect the server pagination metadata in the controls
        function updatePaginationControls() {
            if (!paginationEl) return;

            const totalPages = pagination.totalPages || 0;
            const currentPage = pagination.page || 1;

            if (pageInfoEl) {
                pageInfoEl.textContent = totalPages === 0
                    ? 'No results'
                    : `Page ${currentPage} of ${totalPages}`;
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
            const filters = readFilters();
            const url = buildPageUrl(page, filters);
            history.pushState(null, '', url.toString());
            fetchTrips(page, filters);
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

        regionFilter.addEventListener('change', applyFilters);
        seasonFilter.addEventListener('change', applyFilters);

        if (searchInput) {
            searchInput.addEventListener('input', debounce(applyFilters, 300));
        }

        // Support browser back/forward between visited pages
        window.addEventListener('popstate', () => {
            const params = new URLSearchParams(window.location.search);
            const region = params.get('region');
            const season = params.get('season');
            const q = params.get('q');

            // Reflect the restored URL in the controls before refetching.
            regionFilter.value = region ? region.toLowerCase() : 'all';
            seasonFilter.value = season ? season.toLowerCase() : 'all';
            if (searchInput) searchInput.value = q || '';

            fetchTrips(readPageFromUrl(), readFilters());
        });

        // Load the requested page of data on page load
        fetchTrips(readPageFromUrl(), readFilters());
    });
