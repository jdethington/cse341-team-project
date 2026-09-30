//src/controllers/trains.js
import {
    getTrainById as findTrainById,
    getPaginatedTrains as findPaginatedTrains
} from "../models/trains.js";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

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

        if (errors.length > 0) {
            return res.status(400).json({ errors });
        }

        const { trains, totalItems } = await findPaginatedTrains({
            filter: {},
            page,
            limit,
            sort: "name",
            order: 1,
        });

        const totalPages = Math.ceil(totalItems / limit);

        if (page > totalPages) {
            return res.status(404).json({
                error: `Page ${page} does not exist. The last page is ${totalPages || 0}.`,
            });
        }

        return res.status(200).json({
            data: trains,
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
