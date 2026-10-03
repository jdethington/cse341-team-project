import {
    getTripById as fetchTripById,
    getPaginatedTrips as fetchPaginatedTrips
} from '../models/trips.js';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 48;

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

        if (errors.length > 0) {
            return res.status(400).json({ errors });
        }

        const { trips, totalItems } = await fetchPaginatedTrips({
            filter: {},
            page,
            limit,
            sort: 'name',
            order: 1
        });

        const totalPages = Math.ceil(totalItems / limit);

        if (page > totalPages) {
            return res.status(404).json({
                error: `Page ${page} does not exist. The last page is ${totalPages || 0}.`
            });
        }

        return res.status(200).json({
            data: trips,
            pagination: {
                page,
                limit,
                totalItems,
                totalPages,
                hasNextPage: page * limit < totalItems,
                hasPreviousPage: page > 1
            }
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
