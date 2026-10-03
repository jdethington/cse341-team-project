import {
    getTripById as fetchTripById,
    getPaginatedTrips as fetchPaginatedTrips
} from '../models/trips.js';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 48;
const MAX_SEARCH_LENGTH = 100;
const ALLOWED_REGIONS = ['central', 'hokkaido', 'kansai', 'northern'];
const ALLOWED_SEASONS = ['autumn', 'spring', 'summer', 'winter'];
const ALLOWED_SORT_FIELDS = ['name', 'region', 'season', 'startStation', 'endStation', 'duration'];
const DEFAULT_SORT = 'name';
const DEFAULT_ORDER = 1;

// Escape the user's search text so it is treated as a literal string, not a
// regular expression.
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const parsePositiveInteger = (value, defaultValue) => {
    if (value === undefined) {
        return defaultValue;
    }

    const parsed = Number(value);

    if (!Number.isInteger(parsed) || parsed < 1) {
        return null;
    }

    return parsed;
};

// Validate the region, season, keyword, and sort query parameters, building the
// Mongo filter and the resolved sort options. Validation problems are collected
// so the caller can report every problem in one response.
const parseFilterParams = (query) => {
    const errors = [];
    const filter = {};
    let searchText = null;

    if (query.region !== undefined) {
        const region = String(query.region).toLowerCase();

        if (!ALLOWED_REGIONS.includes(region)) {
            errors.push({
                field: 'region',
                message: `region must be one of: ${ALLOWED_REGIONS.join(', ')}.`
            });
        } else {
            filter.region = region;
        }
    }

    if (query.season !== undefined) {
        const season = String(query.season).toLowerCase();

        if (!ALLOWED_SEASONS.includes(season)) {
            errors.push({
                field: 'season',
                message: `season must be one of: ${ALLOWED_SEASONS.join(', ')}.`
            });
        } else {
            filter.bestSeason = season;
        }
    }

    if (query.q !== undefined) {
        const trimmed = String(query.q).trim();

        if (trimmed.length < 1 || trimmed.length > MAX_SEARCH_LENGTH) {
            errors.push({
                field: 'q',
                message: `Search text must be between 1 and ${MAX_SEARCH_LENGTH} characters.`
            });
        } else {
            searchText = trimmed;
            const searchPattern = new RegExp(escapeRegex(trimmed), 'i');

            // Any match in either the trip name or the description qualifies.
            filter.$or = [
                { name: searchPattern },
                { description: searchPattern }
            ];
        }
    }

    const sort = query.sort !== undefined ? query.sort : DEFAULT_SORT;

    if (!ALLOWED_SORT_FIELDS.includes(sort)) {
        errors.push({
            field: 'sort',
            message: `sort must be one of: ${ALLOWED_SORT_FIELDS.join(', ')}.`
        });
    }

    let order = DEFAULT_ORDER;

    if (query.order !== undefined) {
        if (query.order === 'asc') {
            order = 1;
        } else if (query.order === 'desc') {
            order = -1;
        } else {
            errors.push({
                field: 'order',
                message: 'order must be either asc or desc.'
            });
        }
    }

    return { errors, filter, searchText, sort, order };
};

// Page Controller: Render EJS Trip Details page
export async function renderTripDetails(req, res, next) {
    try {
        const tripId = req.params.id;
        const details = await fetchTripById(tripId);
        if (!details) {
            const err = new Error('Trip not found');
            err.status = 404;
            return next(err);
        }
        return res.render('trips/details', {
            title: 'Trip Details',
            details
        });
    } catch (error) {
        return next(error);
    }
}

// Get a page of trips with pagination metadata
export async function getAllTrips(req, res) {
    try {
        const errors = [];

        const page = parsePositiveInteger(req.query.page, DEFAULT_PAGE);
        const limit = parsePositiveInteger(req.query.limit, DEFAULT_LIMIT);

        if (page === null) {
            errors.push({
                field: 'page',
                message: 'page must be a whole number of 1 or greater.'
            });
        }

        if (limit === null) {
            errors.push({
                field: 'limit',
                message: 'limit must be a number between 1 and 48.'
            });
        } else if (limit > MAX_LIMIT) {
            errors.push({
                field: 'limit',
                message: 'limit must be a number between 1 and 48.'
            });
        }

        const {
            errors: filterErrors,
            filter,
            searchText,
            sort,
            order
        } = parseFilterParams(req.query);

        errors.push(...filterErrors);

        if (errors.length > 0) {
            return res.status(400).json({ errors });
        }

        const { trips, totalItems } = await fetchPaginatedTrips({
            filter,
            page,
            limit,
            sort,
            order
        });

        const totalPages = Math.ceil(totalItems / limit);

        // A page past the last page is a 404, but a filter combination that
        // matches nothing is a valid result: return an empty page with 200 so
        // clients can tell "no matches" apart from "bad page number".
        if (totalItems > 0 && page > totalPages) {
            return res.status(404).json({
                error: `Page ${page} does not exist. The last page is ${totalPages}.`
            });
        }

        // Echo the filters that were actually applied so clients can tell which
        // query produced this page of results.
        const appliedFilters = {
            region: filter.region ?? null,
            season: filter.bestSeason ?? null,
            q: searchText,
            sort,
            order: order === 1 ? 'asc' : 'desc'
        };

        return res.status(200).json({
            data: trips,
            pagination: {
                page,
                limit,
                totalItems,
                totalPages,
                hasNextPage: page * limit < totalItems,
                hasPreviousPage: page > 1
            },
            filters: appliedFilters
        });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to retrieve trips', error: error.message });
    }
}

// Get a single trip by ID
export async function getTripById(req, res) {
    try {
        const tripId = req.params.id;
        const trip = await fetchTripById(tripId);

        if (!trip) {
            return res.status(404).json({ message: 'Trip not found' });
        }

        return res.status(200).json(trip);
    } catch (error) {
        return res.status(500).json({ message: 'Failed to retrieve trip', error: error.message });
    }
}
