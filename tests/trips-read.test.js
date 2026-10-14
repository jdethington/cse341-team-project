import { describe, expect, test } from 'vitest';
import request from 'supertest';
import app from '../app.js';

const TOTAL_TRIPS = 6;

// Seeded trip names in the order the API returns them (name ascending).
const SEEDED_NAMES = [
  'Alpine Panorama Express',
  'Coastal Breeze Line',
  'Kurobe Gorge Explorer',
  'Sagano Romantic Train',
  'Sakura Valley Limited',
  'Winter Wetlands Steam Train'
];

describe('GET /api/trips', () => {
  test('returns 200 with a JSON envelope of trips', async () => {
    const response = await request(app).get('/api/trips');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('application/json');
    expect(response.body.data).toBeInstanceOf(Array);
    expect(response.body).toHaveProperty('pagination');
    expect(response.body).toHaveProperty('filters');
  });

  test('returns all 6 seeded trips in name order', async () => {
    const response = await request(app).get('/api/trips');

    expect(response.body.data).toHaveLength(TOTAL_TRIPS);
    expect(response.body.data.map((trip) => trip.name)).toEqual(SEEDED_NAMES);
  });

  test('returns the important fields for a known trip', async () => {
    const response = await request(app).get('/api/trips');

    const trip = response.body.data.find((item) => item.id === 'alpine-panorama');

    expect(trip).toBeDefined();
    expect(trip.name).toBe('Alpine Panorama Express');
    expect(trip.region).toBe('central');
    expect(trip.startStation).toBe('nagoya');
    expect(trip.endStation).toBe('toyama');
    expect(trip.bestSeason).toBe('autumn');
    expect(typeof trip.distance).toBe('number');
  });
});

describe('GET /api/trips/:id', () => {
  test('returns 200 and the trip for a known id', async () => {
    const response = await request(app).get('/api/trips/alpine-panorama');

    expect(response.status).toBe(200);
    expect(response.body.id).toBe('alpine-panorama');
    expect(response.body.name).toBe('Alpine Panorama Express');
    expect(response.body).toHaveProperty('description');
    expect(response.body).toHaveProperty('highlights');
  });

  test('returns 404 when the trip id does not exist', async () => {
    const response = await request(app).get('/api/trips/does-not-exist');

    expect(response.status).toBe(404);
    expect(response.body.message).toContain('Trip not found');
  });
});
