/** Database setup for BizTime. */

const { Client } = require("pg");

const DB_URI = process.env.NODE_ENV === "test"
    ? "postgresql:///biztime_test"
    : "postgresql:///biztime";

let db = new Client({
  connectionString: DB_URI
});

db.connect();


async function getCompanies() {
  const results = await db.query(
    `SELECT code, name
         FROM companies`);
  return results.rows;
}

async function getCompany(companyCode) {
  const results = await db.query(
    `SELECT code, name
         FROM companies
         WHERE code = $1`, [companyCode]);
  return results.rows[0];
}






module.exports = db;