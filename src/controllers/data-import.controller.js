const RentRollData = require("../models/rent-roll-data.model");
const Property = require("../models/property.model");
const Tenant = require("../models/tenant.model");
const Lease = require("../models/lease.model");
const RentRollImport = require("../models/rent-roll-data.model");
/**
 * A "fuzzy" search function to find a tenant even with small variations in the name.
 * It cleans both the CSV name and DB names before comparing.
 * @param {string} csvTenantName The tenant name from the CSV file.
 * @param {Array} tenants The array of all tenant objects from the database.
 * @returns {object|null} The found tenant object or null.
 */
function findTenant(csvTenantName, tenants) {
  if (!csvTenantName) return null;

  // 1. Clean the incoming name from the CSV.
  // Removes common suffixes, parentheses, and extra spaces.
  const cleanCsvName = csvTenantName
    .toLowerCase()
    .replace(/\(.*\)/, "") // Remove anything in parentheses, e.g. (Master Lease)
    .replace(/,?\s+(llc|inc|ltd)\.?/, "") // Remove llc, inc, etc.
    .trim();

  // 2. Loop through tenants from the database to find the best match.
  for (const tenant of tenants) {
    if (!tenant.name) continue;

    // 3. Clean the database name in the exact same way.
    const cleanDbName = tenant.name
      .toLowerCase()
      .replace(/\(.*\)/, "")
      .replace(/,?\s+(llc|inc|ltd)\.?/, "")
      .trim();

    // 4. If the cleaned names match, we have found our tenant.
    if (cleanCsvName === cleanDbName) {
      return tenant;
    }
  }

  return null; // Return null if no match is found.
}
/**
 * A robust function to find a property based on the text in a CSV header row.
 * It intelligently tries to match against multiple key fields in order of uniqueness:
 * 1. Property ID
 * 2. Entity Name
 * 3. Property Display Name
 * 4. Street Address
 *
 * @param {string} headerText The full text from the CSV row (e.g., "-> GANPATI SUGARLOAF LLC - 4735 Sugarloaf...").
 * @param {Array} properties The array of all property objects fetched from the database.
 * @returns {object|null} The found property object, or null if no confident match is found.
 */
function findPropertyContext(headerText, properties) {
  // First, clean the input text from the CSV to make matching easier.
  // We remove the "->" prefix, trim whitespace, and convert to lowercase.
  const cleanHeaderText = headerText.replace("->", "").trim().toLowerCase();

  // We loop through each property in our database to find the best possible match.
  for (const prop of properties) {
    // Create a clean array of potential unique identifiers for this specific property.
    // We prioritize more unique identifiers first.
    const identifiers = [
      prop.propertyId?.toLowerCase().trim(),
      prop.entityName?.toLowerCase().trim(),
      prop.name?.toLowerCase().trim(),
      prop.address?.street?.toLowerCase().trim(),
    ].filter(Boolean);

    // Now, we check if the text from the CSV file includes any of these known identifiers.
    for (const id of identifiers) {
      // .includes() provides a "fuzzy" match. The CSV can have extra text like " - " and still find a match.
      if (cleanHeaderText.includes(id)) {
        console.log(
          `Found match for property header "${cleanHeaderText}" with identifier "${id}"`
        );
        return prop; // As soon as we find a confident match, we return the property and stop searching.
      }
    }
  }

  // If we loop through every single property and none of their identifiers are found
  // in the header text, we conclude that no match exists.
  return null;
}

/**
 * POST /api/data-import/rent-roll
 * The main controller function. Performs a full reconciliation of CSV data
 * against the database and stores the linked results in the RentRollImport table.
 */
exports.uploadRentRollData = async (req, res) => {
  const csvData = req.body.data;
  const sourceFileName = req.body.fileName;

  if (!Array.isArray(csvData) || csvData.length < 2) {
    return res.status(400).json({ message: "Invalid or empty CSV data." });
  }

  try {
    const [properties, tenants] = await Promise.all([
      Property.findAll(),
      Tenant.findAll(),
    ]);

    // We no longer need the tenantMap, as our new function is more powerful.

    let currentPropertyContext = null;
    const recordsToCreate = [];
    const errors = [];

    for (let i = 0; i < csvData.length; i++) {
      const row = csvData[i];
      if (!row || row.length < 2) continue;

      const firstCell = String(row[0] || "").trim();

      if (firstCell.startsWith("->")) {
        currentPropertyContext = findPropertyContext(firstCell, properties);
        if (!currentPropertyContext) {
          errors.push({
            row: i + 1,
            text: firstCell,
            reason: `Could not find a matching Property in the database.`,
          });
        }
        continue;
      }

      const lastPaymentDateStr = String(row[0] || "").trim();
      const tenantNameFromCsv = String(row[1] || "").trim();
      const description = String(row[3] || "").trim();
      const amountStr = String(row[5] || "0").replace(/,/g, "");
      const receivableAmount = parseFloat(amountStr);
      const unitName = String(row[6] || "").trim();

      if (
        tenantNameFromCsv &&
        !isNaN(receivableAmount)
      ) {
        const date = new Date(lastPaymentDateStr);

        if (isNaN(date.getTime())) {
          errors.push({
            row: i + 1,
            text: tenantNameFromCsv,
            reason: `Invalid date format in 'Last Payment' column.`,
          });
          continue;
        }
        if (!currentPropertyContext) {
          errors.push({
            row: i + 1,
            text: tenantNameFromCsv,
            reason: "This tenant row appears before a valid Property header.",
          });
          continue;
        }

        const foundUnit = currentPropertyContext.units?.find(
          (u) => u.name?.trim() === unitName
        );
        if (!foundUnit) {
          errors.push({
            row: i + 1,
            text: `Unit: ${unitName}`,
            reason: `Unit not found in property "${
              currentPropertyContext.name || currentPropertyContext.entityName
            }".`,
          });
          continue;
        }

        // 👇 USE OUR NEW, MORE ACCURATE FINDTENANT FUNCTION 👇
        const foundTenant = findTenant(tenantNameFromCsv, tenants);

        if (!foundTenant) {
          errors.push({
            row: i + 1,
            text: `Tenant: ${tenantNameFromCsv}`,
            reason: "A matching tenant could not be found in the database.",
          });
          continue;
        }

        // --- Success! All IDs have been found. Prepare the record. ---
        recordsToCreate.push({
          propertyId: currentPropertyContext.id,
          unitId: foundUnit.id,
          tenantId: foundTenant.id,
          description: description,
          amountReceivable: receivableAmount,
          lastPaymentDate: date,
          month: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
            2,
            "0"
          )}`,
          sourceFile: sourceFileName,
          importDate: new Date(),
        });
      } // else, it's a blank row or a total row, so we safely ignore it.
    }

    // 4. Save all successfully processed records to the database.
    if (recordsToCreate.length > 0) {
      // This strategy replaces previous imports from the same file.
      const transaction = await RentRollImport.sequelize.transaction();
      try {
        await RentRollImport.destroy({
          where: { sourceFile: sourceFileName },
          transaction,
        });
        await RentRollImport.bulkCreate(recordsToCreate, { transaction });
        await transaction.commit();
      } catch (dbError) {
        await transaction.rollback();
        throw dbError; // Pass the error to the main catch block
      }
    }

    // 5. Send a comprehensive response back to the frontend.
    res.status(200).json({
      message: `Import complete. Successfully processed and saved ${recordsToCreate.length} records.`,
      errors: errors,
      errorCount: errors.length,
    });
  } catch (error) {
    console.error("An error occurred during CSV reconciliation:", error);
    res.status(500).json({
      message: "An error occurred during CSV reconciliation.",
      error: error.message,
    });
  }
};
// GET /api/data-import/rent-roll
exports.getRentRollData = async (req, res) => {
  try {
    const data = await RentRollData.findAll({
      order: [["month", "ASC"]], // Always return in chronological order
    });
    res.status(200).json(data);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching rent roll data", error: error.message });
  }
};
