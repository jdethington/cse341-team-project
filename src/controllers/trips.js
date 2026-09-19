import { getDb } from '../db/connect.js';

export async function renderTripDetails(req, res) {
    try {
        const tripId = req.params.id;
        const db = getDb();

        // Fetch trip from database (schedules are now handled client-side via API)
        const details = await db.collection('trips').findOne({ id: tripId });

        if (!details) {
            return res.status(404).render('errors/404', { title: 'Trip Not Found' });
        }

        // Render EJS view with trip details only
        return res.render('trips/details', {
            title: details.name || 'Trip Details',
            details: details
        });
    } catch (error) {
        console.error('Error rendering trip details page:', error);
        return res.status(500).render('errors/500', { error: error.message });
    }
}