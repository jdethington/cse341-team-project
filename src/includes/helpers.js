/**
 * Generates a unique Japan Rail like booking code for bookings.
 * @returns {string} A unique booking code.
 */
const generateBookingCode = () => {
  return "JR" + Math.random().toString(36).substring(2, 10).toUpperCase();
};

/**
 * Converts kilometers to miles.
 * @param {number} km - The distance in kilometers.
 * @returns {number} The equivalent distance in miles.
 */
const kmToMiles = (km) => {
  const conversionFactor = 0.621371;
  return km * conversionFactor;
};

/**
 * Converts Japanese Yen to US Dollars.
 * @param {number} yen - The amount in Japanese Yen.
 * @returns {number} The equivalent amount in US Dollars.
 */
const yenToUsd = (yen) => {
  const exchangeRate = 0.0066; // Example rate: 1 Yen = 0.0066 USD
  return yen * exchangeRate;
};

export { generateBookingCode, kmToMiles, yenToUsd };
