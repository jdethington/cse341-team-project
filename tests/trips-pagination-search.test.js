import { describe, expect, test } from 'vitest';
import request from 'supertest';
import app from '../app.js';

const TOTAL_TRIPS = 6;

describe('GET /api/trips pagination', () => {
  test('returns the requested page with pagination metadata', async () => {
    const response = await request(app).get('/api/trips?page=1&limit=2');

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(2);
    expect(response.body.pagination).toEqual({
      page: 1,
      limit: 2,
      totalItems: TOTAL_TRIPS,
      totalPages: 3,
      hasNextPage: true,
      hasPreviousPage: false
    });
  });

  test('returns 400 with an errors array for invalid page and limit values', async () => {
    const response = await request(app).get('/api/trips?page=0&limit=99');

    expect(response.status).toBe(400);
    expect(response.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: 'page' }),
        expect.objectContaining({ field: 'limit' })
      ])
    );
  });
});

describe('GET /api/trips partial page', () => {
  test('returns fewer records than the limit on the last page', async () => {
    const response = await request(app).get('/api/trips?page=2&limit=4');

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(2);
    expect(response.body.pagination.totalItems).toBe(TOTAL_TRIPS);
    expect(response.body.pagination.totalPages).toBe(2);
    expect(response.body.pagination.hasNextPage).toBe(false);
    expect(response.body.pagination.hasPreviousPage).toBe(true);
  });

  test('returns the whole catalog on one page when limit exceeds the total', async () => {
    const response = await request(app).get('/api/trips?limit=48');

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(TOTAL_TRIPS);
    expect(response.body.pagination.limit).toBe(48);
    expect(response.body.pagination.totalPages).toBe(1);
    expect(response.body.pagination.hasNextPage).toBe(false);
  });
});

describe('GET /api/trips region filter', () => {
  test('filters by region and returns only matching trips', async () => {
    const response = await request(app).get('/api/trips?region=kansai');

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(2);
    expect(response.body.data.every((trip) => trip.region === 'kansai')).toBe(true);
    expect(response.body.filters.region).toBe('kansai');
  });

  test('matches region case-insensitively', async () => {
    const response = await request(app).get('/api/trips?region=KANSAI');

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(2);
    expect(response.body.data.every((trip) => trip.region === 'kansai')).toBe(true);
  });

  test('filters a single-trip region', async () => {
    const response = await request(app).get('/api/trips?region=northern');

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].name).toBe('Coastal Breeze Line');
  });
});

describe('GET /api/trips season filter', () => {
  test('filters by season and returns only matching trips', async () => {
    const response = await request(app).get('/api/trips?season=autumn');

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(3);
    expect(response.body.data.every((trip) => trip.bestSeason === 'autumn')).toBe(true);
    expect(response.body.filters.season).toBe('autumn');
  });

  test('matches season case-insensitively', async () => {
    const response = await request(app).get('/api/trips?season=SPRING');

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].name).toBe('Sakura Valley Limited');
    expect(response.body.data[0].bestSeason).toBe('spring');
  });
});

describe('GET /api/trips keyword search', () => {
  test('matches a keyword in the trip name', async () => {
    const response = await request(app).get('/api/trips?q=alpine');

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].name).toBe('Alpine Panorama Express');
    expect(response.body.filters.q).toBe('alpine');
  });

  test('matches a keyword in the trip description', async () => {
    const response = await request(app).get('/api/trips?q=coastline');

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].name).toBe('Coastal Breeze Line');
  });

  test('treats regular expression characters in the keyword as literal text', async () => {
    const response = await request(app).get('/api/trips?q=(alpine');

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual([]);
  });
});

describe('GET /api/trips zero matches', () => {
  test('returns an empty page when the keyword matches nothing', async () => {
    const response = await request(app).get('/api/trips?q=NonExistentTrainRoute999');

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual([]);
    expect(response.body.pagination.totalItems).toBe(0);
    expect(response.body.pagination.totalPages).toBe(0);
    expect(response.body.pagination.hasNextPage).toBe(false);
  });

  test('returns an empty page when combined filters match nothing', async () => {
    const response = await request(app).get('/api/trips?region=central&season=winter');

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual([]);
    expect(response.body.pagination.totalItems).toBe(0);
  });
});
