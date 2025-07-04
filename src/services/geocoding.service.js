// src/services/geocoding.service.js
const { Client } = require("@googlemaps/google-maps-services-js");
require("dotenv").config();

// 1. Create a new Google Maps client instance
const client = new Client({});

/**
 * Converts a street address into latitude and longitude using Google's Geocoding API.
 * @param {object} address - An address object { street, city, state, zip }.
 * @returns {Promise<{latitude: number, longitude: number} | null>} A promise that resolves to the coordinates or null.
 */
const getCoordsFromAddress = async (address) => {
  if (!address || !address.street || !address.city || !address.state) {
    console.warn("Geocoding skipped: Incomplete address provided.");
    return null;
  }

  // 2. Construct the single address string that the API expects
  const addressString = `${address.street}, ${address.city}, ${address.state} ${address.zip}`;

  try {
    // 3. Make the API call using the client
    const response = await client.geocode({
      params: {
        address: addressString,
        key: process.env.GOOGLE_MAPS_API_KEY,
      },
      timeout: 1000, // Optional timeout in milliseconds
    });

    // 4. Check the response and extract the coordinates
    if (response.data.status === "OK" && response.data.results.length > 0) {
      const location = response.data.results[0].geometry.location;
      const coords = {
        latitude: parseFloat(location.lat),
        longitude: parseFloat(location.lng),
      };
      console.log(
        `Google Geocoding successful for "${addressString}":`,
        coords
      );
      return coords;
    } else {
      // Log specific statuses from Google like ZERO_RESULTS or REQUEST_DENIED
      console.warn(
        `Google Geocoding failed for "${addressString}". Status: ${response.data.status}`
      );
      if (response.data.error_message) {
        console.error("Google API Error:", response.data.error_message);
      }
      return null;
    }
  } catch (error) {
    // This catches network errors or client configuration errors
    console.error("Error calling Google Geocoding API:", error.message);
    // Check if it's an API error response
    if (error.response) {
      console.error("Response data:", error.response.data);
    }
    return null;
  }
};

module.exports = { getCoordsFromAddress };
