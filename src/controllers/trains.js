//src/controllers/trains.js
import {
    getTrainById as findTrainById,
    getPaginatedTrains as findPaginatedTrains
} from "../models/trains.js";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;
const MAX_SEARCH_LENGTH = 100;
const ALLOWED_SORT_FIELDS = [
    "name",
    "operator",
    "type",
    "maxSpeedKmh",
    "capacity",
    "powerSource",
    "createdAt",
];
const ALLOWED_POWER_SOURCES = ["Electric", "Diesel", "Steam"];
const DEFAULT_SORT = "name";
const DEFAULT_ORDER = "asc";

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

const parseSearchParams = (query) => {
    const errors = [];
    const filter = {};
    let searchText = null;

    if (query.q !== undefined) {
        if (typeof query.q !== "string") {
            errors.push({
                field: "q",
                message: "Search text must be a single string.",
            });
        } else {
            const trimmed = query.q.trim();

            if (trimmed.length < 1 || trimmed.length > MAX_SEARCH_LENGTH) {
                errors.push({
                    field: "q",
                    message: `Search text must be between 1 and ${MAX_SEARCH_LENGTH} characters.`,
                });
            } else {
                searchText = trimmed;
                const searchPattern = new RegExp(escapeRegex(trimmed), "i");
                filter.$or = [
                    { name: searchPattern },
                    { operator: searchPattern },
                    { type: searchPattern },
                    { description: searchPattern },
                ];
            }
        }
    }

    if (query.powerSource !== undefined) {
        if (!ALLOWED_POWER_SOURCES.includes(query.powerSource)) {
            errors.push({
                field: "powerSource",
                message: `powerSource must be one of: ${ALLOWED_POWER_SOURCES.join(", ")}.`,
            });
        } else {
            filter.powerSource = query.powerSource;
        }
    }

    const sort = query.sort !== undefined ? query.sort : DEFAULT_SORT;

    if (!ALLOWED_SORT_FIELDS.includes(sort)) {
        errors.push({
            field: "sort",
            message: `sort must be one of: ${ALLOWED_SORT_FIELDS.join(", ")}.`,
        });
    }

    if (query.order !== undefined && query.order !== "asc" && query.order !== "desc") {
        errors.push({
            field: "order",
            message: "order must be either asc or desc.",
        });
    }

    return {
        errors,
        filter,
        searchText,
        sort,
        order: query.order === "desc" ? "desc" : DEFAULT_ORDER,
    };
};

export async function getTrainById(req, res) {
    try {
        const { id } = req.params;

        const train = await findTrainById(id);

        if (!train) {
            return res.status(404).json({
                error: "Train not found",
            });
        }

        return res.status(200).json(train);
    } catch (error) {
        console.error("Error fetching train:", error);

        return res.status(500).json({
            error: "Failed to fetch train",
        });
    }
}

export async function getAllTrains(req, res) {
    try {
        const errors = [];

        const page = parsePositiveInteger(req.query.page, DEFAULT_PAGE);
        const limit = parsePositiveInteger(req.query.limit, DEFAULT_LIMIT);

        if (page === null) {
            errors.push({
                field: "page",
                message: "page must be a whole number of 1 or greater.",
            });
        }

        if (limit === null) {
            errors.push({
                field: "limit",
                message: "limit must be a number between 1 and 50.",
            });
        } else if (limit > MAX_LIMIT) {
            errors.push({
                field: "limit",
                message: "limit must be a number between 1 and 50.",
            });
        }

        const { errors: searchErrors, filter, searchText, sort, order } = parseSearchParams(req.query);
        errors.push(...searchErrors);

        if (errors.length > 0) {
            return res.status(400).json({ errors });
        }

        const { trains, totalItems } = await findPaginatedTrains({
            filter,
            page,
            limit,
            sort,
            order: order === "desc" ? -1 : 1,
        });

        const totalPages = Math.ceil(totalItems / limit);

        // A no-match search is a valid empty result (200), not a missing page.
        // Only 404 when results exist but the requested page is past the end.
        if (totalItems > 0 && page > totalPages) {
            return res.status(404).json({
                error: `Page ${page} does not exist. The last page is ${totalPages}.`,
            });
        }

        return res.status(200).json({
            data: trains,
            query: {
                sort,
                order,
                ...(searchText ? { q: searchText } : {}),
                ...(filter.powerSource ? { powerSource: filter.powerSource } : {}),
            },
            pagination: {
                page,
                limit,
                totalItems,
                totalPages,
                hasNextPage: page * limit < totalItems,
                hasPreviousPage: page > 1,
            },
        });
    } catch (error) {
        console.error("Error fetching trains:", error);

        return res.status(500).json({
            error: "Failed to fetch trains",
        });
    }
}
