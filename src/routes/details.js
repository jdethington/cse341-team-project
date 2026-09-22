import { getDb } from '../db/connect.js';

export default async (req, res, next) => {
    const { tripId } = req.params;
    const db = getDb();
    const details = await db.collection('trips').findOne({ id: tripId });

    if (!details) {
        const err = new Error('Trip not found');
        err.status = 404;
        return next(err);
    }

    details.schedules = await db.collection('schedules').find({ tripId }).toArray();

    return res.render('trips/details', {
        title: 'Trip Details',
        details
    });
};
