# GitHub Issue: Automated Read Tests for the Trips API

## Issue Title

Add Vitest read tests for `GET /api/trips` and `GET /api/trips/:id`

## Description

The Trips API has no automated coverage for its read endpoints beyond manual
checks through Swagger or the browser. A regression in the list response
envelope or in single-trip lookup could ship unnoticed.

Add an automated test file that verifies the two read endpoints of Feature
Set 1: the endpoint that returns all trips and the endpoint that returns one
trip. The tests must confirm successful status codes, important response
fields, and known seeded trip data, and must include a not-found case for a
trip id that does not exist.

Tests run against the temporary in-memory MongoDB started by
`tests/global-setup.js`; they never touch the production database. The
database is dropped and re-seeded before every test, so each test starts from
the same six known trips.

## Assigned Feature Set

- Feature Set 1: Trips API
- Resource: `trips`
- Routes: `GET /api/trips`, `GET /api/trips/:id`
- Related learning activity: Week 06 - Automated Testing with Vitest

## Acceptance Criteria

- [ ] New test file `tests/trips-read.test.js` using Vitest and Supertest.
- [ ] `GET /api/trips` returns status 200 with a JSON content type and the
      `data`, `pagination`, and `filters` response fields.
- [ ] `GET /api/trips` returns all 6 seeded trips in name-ascending order.
- [ ] A known seeded trip (`alpine-panorama`) exposes its important fields:
      name, region, startStation, endStation, bestSeason, and numeric distance.
- [ ] `GET /api/trips/alpine-panorama` returns status 200 with the trip body,
      including `id`, `name`, `description`, and `highlights`.
- [ ] `GET /api/trips/does-not-exist` returns status 404 with a
      `Trip not found` message.
- [ ] Full test suite passes (`npm test`) and lint is clean (`npm run lint`).
- [ ] For Spicific Test use the `npx vitest run trips-read.test.js to test` 

## Technical Notes & File References

- Test file: `tests/trips-read.test.js` (new)
- App under test: `app.js` (imported directly; no server start or port)
- List controller: `src/controllers/trips.js` (`getAllTrips`)
- Single controller: `src/controllers/trips.js` (`getTripById`, looks up the
  string `id`, not Mongo `_id`)
- Routes: `src/routes/api-routes.js` (`GET /api/trips` line 467,
  `GET /api/trips/:id` line 510)
- Seed data: `src/db/seeds/trips.json` (6 trips)
- Test infrastructure (already exists): `vitest.config.js`,
  `tests/global-setup.js`, `tests/setup.js`

## Testing Steps

1. Run `npx vitest run trips-read.test.js` - Specific test
2. Run `npm test` from the project root. - or Test for all
3. Confirm `tests/trips-read.test.js` reports 5 passing tests.
4. Confirm the complete suite passes with no regressions in other test files.
5. Run `npm run lint` and confirm no errors.
