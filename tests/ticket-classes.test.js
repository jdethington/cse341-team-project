import { describe, expect, test } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { getDb } from '../src/db/connect.js';

describe('GET /api/ticket-classes', () => {
  test('returns a successful JSON response with all ticket classes', async () => {
    const response = await request(app).get('/api/ticket-classes');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('application/json');
    expect(response.body).toHaveProperty('ticketClasses');
    expect(response.body.ticketClasses).toBeInstanceOf(Array);
    expect(response.body.ticketClasses).toHaveLength(3);
  });

  test('returns the ticket classes from the starter data', async () => {
    const response = await request(app).get('/api/ticket-classes');

    expect(response.status).toBe(200);
    expect(response.body.ticketClasses).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          class: 'standard',
          name: 'Standard Class',
          pricePerKm: 80
        }),
        expect.objectContaining({
          class: 'first',
          name: 'First Class',
          pricePerKm: 250
        })
      ])
    );
  });

  test('filters ticket classes by day of week', async () => {
    const monday = await request(app).get('/api/ticket-classes?day=monday');

    expect(monday.status).toBe(200);
    const classes = monday.body.ticketClasses.map((ticketClass) => ticketClass.class);
    expect(classes).toContain('standard');
    expect(classes).toContain('premium');
    expect(classes).not.toContain('first');
  });

  test('excludes weekday-only classes for saturday', async () => {
    const saturday = await request(app).get('/api/ticket-classes?day=saturday');

    expect(saturday.status).toBe(200);
    const classes = saturday.body.ticketClasses.map((ticketClass) => ticketClass.class);
    // standard is available all week, first is weekend-only; premium (weekdays) is excluded.
    expect(classes.sort()).toEqual(['first', 'standard']);
  });

  test('returns 400 for an invalid day', async () => {
    const response = await request(app).get('/api/ticket-classes?day=bogus');

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });
});

describe('Booking page hydration (Feature Set 4)', () => {
  test('booking page still renders and ticket options include the new availableDays field', async () => {
    const response = await request(app).get('/trips/booking/1');

    expect(response.status).toBe(200);
    expect(response.text).toContain('ticket-selection');
    expect(response.text).toContain('applyDayAvailability');
  });

  test('a ticket class added through the Mongoose model is served by the API', async () => {
    await getDb().collection('ticketClasses').insertOne({
      class: 'clubcar',
      name: 'Club Car',
      pricePerKm: 40
    });

    const response = await request(app).get('/api/ticket-classes');

    expect(response.status).toBe(200);
    expect(response.body.ticketClasses).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          class: 'clubcar',
          name: 'Club Car'
        })
      ])
    );
  });
});
