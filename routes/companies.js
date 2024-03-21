"use strict";

const express = require('express');
const router = new express.Router();

const db = require("./db");
const { BadRequestError } = require('../expressError');

/** */
router.get("/", async function (req, res, next) {
  const companies = await db.getCompanies();
  return res.json({ companies });
});

/** */
router.get("/:code", async function (req, res, next) {
  const companyCode = req.params.code;
  const company = await db.getCompany(companyCode);
  // if company === undefined throw not found error
  return res.json({ company });
});

/** Adds a company.
 * Returns obj of new company: {company: {code, name, description}}
*/
router.post('/companies', async function (req, res, next) {

  if (!req.body) throw new BadRequestError();

  const { code, name, description } = req.body;

  const result = await db.query(
    `INSERT INTO companies (code, name, description)
    VALUES ($1, $2, $3)
    RETURNING code, name, description`,
    [code, name, description],
  );

  const company = result.rows[0];

  return res.status(201).json({ company });

});


module.exports = router;
