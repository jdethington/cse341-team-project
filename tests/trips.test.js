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

describe('GET /api/trips filtering and search', () => {
  test('filters by region and reports the applied filter', async () => {
    const response = await request(app).get('/api/trips?region=central');

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(2);
    response.body.data.forEach((trip) => {
      expect(trip.region).toBe('central');
    });
    expect(response.body.pagination.totalItems).toBe(2);
    expect(response.body.filters.region).toBe('central');
    expect(response.body.filters.season).toBeNull();
    expect(response.body.filters.q).toBeNull();
  });

  test('filters by season', async () => {
    const response = await request(app).get('/api/trips?season=autumn');

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(3);
    response.body.data.forEach((trip) => {
      expect(trip.bestSeason).toBe('autumn');
    });
    expect(response.body.filters.season).toBe('autumn');
  });

  test('combines region and season filters', async () => {
    const response = await request(app).get('/api/trips?region=kansai&season=autumn');

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].name).toBe('Sagano Romantic Train');
    expect(response.body.pagination.totalItems).toBe(1);
  });

  test('matches region and season case-insensitively', async () => {
    const response = await request(app).get('/api/trips?region=CENTRAL&season=Autumn');

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(2);
    expect(response.body.filters.region).toBe('central');
    expect(response.body.filters.season).toBe('autumn');
  });

  test('searches the trip description with q', async () => {
    const response = await request(app).get('/api/trips?q=Alps');

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(2);
    expect(response.body.filters.q).toBe('Alps');
    response.body.data.forEach((trip) => {
      expect(trip.description.toLowerCase()).toContain('alps');
    });
  });

  test('searches the trip name with q', async () => {
    const response = await request(app).get('/api/trips?q=Sakura');

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].name).toBe('Sakura Valley Limited');
  });

  test('searches with q case-insensitively', async () => {
    const response = await request(app).get('/api/trips?q=sakura');

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].name).toBe('Sakura Valley Limited');
  });

  test('treats regular expression characters in q as literal text', async () => {
    // An unescaped "(" would build an invalid pattern and throw a 500.
    const paren = await request(app).get('/api/trips?q=(alpine');

    expect(paren.status).toBe(200);
    expect(paren.body.data).toEqual([]);

    // ".*" unescaped would match every trip; escaped it is literal text and
    // therefore matches nothing.
    const wildcard = await request(app).get('/api/trips?q=.*');

    expect(wildcard.status).toBe(200);
    expect(wildcard.body.data).toEqual([]);
    expect(wildcard.body.pagination.totalItems).toBe(0);
  });

  test('does not match trip fields outside name and description', async () => {
    // "Kushiro" appears in startStation, not in the name or description.
    const response = await request(app).get('/api/trips?q=Kushiro');

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual([]);
    expect(response.body.pagination.totalItems).toBe(0);
  });

  test('returns 200 with an empty page when the filters match nothing', async () => {
    const response = await request(app).get('/api/trips?region=central&q=zzzznotfound');

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual([]);
    expect(response.body.pagination.totalItems).toBe(0);
    expect(response.body.pagination.totalPages).toBe(0);
    expect(response.body.pagination.hasNextPage).toBe(false);
    expect(response.body.pagination.hasPreviousPage).toBe(false);
  });

  test('paginates the filtered result set', async () => {
    const first = await request(app).get('/api/trips?limit=1&page=1');
    const second = await request(app).get('/api/trips?limit=1&page=2');

    expect(first.body.pagination.totalItems).toBe(TOTAL_TRIPS);
    expect(first.body.pagination.totalPages).toBe(TOTAL_TRIPS);
    expect(first.body.data).toHaveLength(1);
    expect(second.body.data).toHaveLength(1);
    expect(first.body.data[0].id).not.toBe(second.body.data[0].id);
  });

  test('sorts results by the requested field and order', async () => {
    const response = await request(app).get('/api/trips?sort=region&order=asc');

    expect(response.status).toBe(200);
    expect(response.body.filters.sort).toBe('region');
    expect(response.body.filters.order).toBe('asc');
    expect(response.body.data.map((trip) => trip.region)).toEqual([
      'central',
      'central',
      'hokkaido',
      'kansai',
      'kansai',
      'northern'
    ]);
  });

  test('reports the default sort when no sort is requested', async () => {
    const response = await request(app).get('/api/trips');

    expect(response.body.filters.sort).toBe('name');
    expect(response.body.filters.order).toBe('asc');
  });

  test('returns 400 for an unknown region', async () => {
    const response = await request(app).get('/api/trips?region=atlantis');

    expect(response.status).toBe(400);
    expect(response.body.errors).toEqual(
      expect.arrayContaining([expect.objectContaining({ field: 'region' })])
    );
  });

  test('returns 400 for an unknown season', async () => {
    const response = await request(app).get('/api/trips?season=monsoon');

    expect(response.status).toBe(400);
    expect(response.body.errors).toEqual(
      expect.arrayContaining([expect.objectContaining({ field: 'season' })])
    );
  });

  test('returns 400 for an unknown sort field', async () => {
    const response = await request(app).get('/api/trips?sort=colour');

    expect(response.status).toBe(400);
    expect(response.body.errors).toEqual(
      expect.arrayContaining([expect.objectContaining({ field: 'sort' })])
    );
  });

  test('returns 400 for an invalid order', async () => {
    const response = await request(app).get('/api/trips?order=sideways');

    expect(response.status).toBe(400);
    expect(response.body.errors).toEqual(
      expect.arrayContaining([expect.objectContaining({ field: 'order' })])
    );
  });

  test('returns 400 when q is longer than the search limit', async () => {
    const response = await request(app).get(`/api/trips?q=${'a'.repeat(101)}`);

    expect(response.status).toBe(400);
    expect(response.body.errors).toEqual(
      expect.arrayContaining([expect.objectContaining({ field: 'q' })])
    );
  });

  test('accepts q at exactly the search limit', async () => {
    const response = await request(app).get(`/api/trips?q=${'a'.repeat(100)}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual([]);
  });

  test('reports every invalid parameter in one 400 response', async () => {
    const response = await request(app).get('/api/trips?page=0&region=atlantis&season=monsoon&sort=colour&order=sideways');

    expect(response.status).toBe(400);
    expect(response.body.errors.map((error) => error.field).sort()).toEqual([
      'order',
      'page',
      'region',
      'season',
      'sort'
    ]);
  });
});
