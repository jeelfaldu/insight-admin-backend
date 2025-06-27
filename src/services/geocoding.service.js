// src/services/geocoding.service.js
const axios = require("axios");

// The public API endpoint for Nominatim
const NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org/search";

/**
 * Converts a street address into latitude and longitude coordinates using Nominatim.
 * @param {object} address - An address object { street, city, state, zip }.
 * @returns {Promise<{latitude: number, longitude: number} | null>} A promise that resolves to the coordinates or null.
 */
const getCoordsFromAddress = async (address) => {
  if (!address || !address.street || !address.city || !address.state) {
    return null;
  }

  // Construct a single query string from the address object
  const queryString = `${address.street}, ${address.city}, ${address.state} ${address.zip}`;

  try {
    const response = await axios.get(NOMINATIM_BASE_URL, {
      params: {
        q: queryString,
        format: "json",
        limit: 1, // We only want the top result
        // It's good practice to set a custom User-Agent
        headers: { "User-Agent": "InsightVenturesAdmin/1.0" },
      },
    });

    // Check if Nominatim returned any results
    if (response.data && response.data.length > 0) {
      const result = response.data[0];
      const coords = {
        latitude: parseFloat(result.lat),
        longitude: parseFloat(result.lon),
      };
      console.log(`Geocoding successful for "${queryString}":`, coords);
      return coords;
    } else {
      console.warn(`No geocoding results for address: "${queryString}"`);
      return null;
    }
  } catch (error) {
    console.error("Error calling Nominatim API:", error.message);
    return null;
  }
};

module.exports = { getCoordsFromAddress };
