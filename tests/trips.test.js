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
  test('returns a successful JSON response with a pagination envelope', async () => {
    const response = await request(app).get('/api/trips');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('application/json');
    expect(response.body).toHaveProperty('data');
    expect(response.body.data).toBeInstanceOf(Array);
    expect(response.body).toHaveProperty('pagination');
  });

  test('defaults to the first page with a limit of 10', async () => {
    const response = await request(app).get('/api/trips');

    expect(response.status).toBe(200);
    expect(response.body.pagination).toEqual({
      page: 1,
      limit: 10,
      totalItems: TOTAL_TRIPS,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false
    });
  });

  test('returns every seeded trip on the default page', async () => {
    const response = await request(app).get('/api/trips');

    expect(response.body.data).toHaveLength(TOTAL_TRIPS);
    expect(response.body.data.map((trip) => trip.name)).toEqual(SEEDED_NAMES);
  });

  test('splits the seeded trips across pages when limit is given', async () => {
    const first = await request(app).get('/api/trips?page=1&limit=2');
    const second = await request(app).get('/api/trips?page=2&limit=2');
    const third = await request(app).get('/api/trips?page=3&limit=2');

    expect(first.status).toBe(200);
    expect(first.body.pagination).toEqual({
      page: 1,
      limit: 2,
      totalItems: TOTAL_TRIPS,
      totalPages: 3,
      hasNextPage: true,
      hasPreviousPage: false
    });
    expect(first.body.data.map((trip) => trip.name)).toEqual([
      'Alpine Panorama Express',
      'Coastal Breeze Line'
    ]);

    expect(second.status).toBe(200);
    expect(second.body.pagination.page).toBe(2);
    expect(second.body.pagination.hasNextPage).toBe(true);
    expect(second.body.pagination.hasPreviousPage).toBe(true);
    expect(second.body.data.map((trip) => trip.name)).toEqual([
      'Kurobe Gorge Explorer',
      'Sagano Romantic Train'
    ]);

    expect(third.status).toBe(200);
    expect(third.body.pagination.hasNextPage).toBe(false);
    expect(third.body.pagination.hasPreviousPage).toBe(true);
    expect(third.body.data.map((trip) => trip.name)).toEqual([
      'Sakura Valley Limited',
      'Winter Wetlands Steam Train'
    ]);
  });

  test('never returns overlapping trips across pages', async () => {
    const first = await request(app).get('/api/trips?page=1&limit=4');
    const second = await request(app).get('/api/trips?page=2&limit=4');

    const firstIds = first.body.data.map((trip) => trip.id);
    const secondIds = second.body.data.map((trip) => trip.id);

    expect(firstIds).toHaveLength(4);
    expect(secondIds).toHaveLength(2);
    expect(firstIds.filter((id) => secondIds.includes(id))).toHaveLength(0);
  });

  test('caps the page size at 48', async () => {
    const response = await request(app).get('/api/trips?limit=49');

    expect(response.status).toBe(400);
    expect(response.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: 'limit' })
      ])
    );
  });

  test('accepts a limit of exactly 48', async () => {
    const response = await request(app).get('/api/trips?limit=48');

    expect(response.status).toBe(200);
    expect(response.body.pagination.limit).toBe(48);
    expect(response.body.pagination.totalItems).toBe(TOTAL_TRIPS);
    expect(response.body.data).toHaveLength(TOTAL_TRIPS);
  });

  test('returns 400 with an errors array for invalid pagination values', async () => {
    const response = await request(app).get('/api/trips?page=0&limit=abc');

    expect(response.status).toBe(400);
    expect(response.body.errors).toBeInstanceOf(Array);
    expect(response.body.errors.map((error) => error.field).sort()).toEqual([
      'limit',
      'page'
    ]);
    response.body.errors.forEach((error) => {
      expect(typeof error.message).toBe('string');
    });
  });

  test('returns 404 when the requested page is past the last page', async () => {
    const response = await request(app).get('/api/trips?page=99&limit=2');

    expect(response.status).toBe(404);
    expect(response.body.error).toContain('Page 99 does not exist');
    expect(response.body.error).toContain('The last page is 3');
  });
});
