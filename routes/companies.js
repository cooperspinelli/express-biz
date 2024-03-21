"use strict";

const express = require('express');
const router = new express.Router();

const db = require("../db");
const { BadRequestError, NotFoundError } = require('../expressError');

/** Returns json containing all companies:
 * {companies: [{code, name}, ...]} */
router.get("/", async function (req, res, next) {
  const results = await db.query(
    `SELECT code, name
         FROM companies`);
  const companies = results.rows;
  return res.json({ companies });
});

/** Returns json containing comapny whose cade matches the url parameter:
 * {company: {code, name, description}} */
router.get("/:code", async function (req, res, next) {
  const companyCode = req.params.code;
  const results = await db.query(
    `SELECT code, name, description
         FROM companies
         WHERE code = $1`, [companyCode]);
  const company = results.rows[0];

  if (!company) {
    throw new NotFoundError();
  }

  return res.json({ company });
});

/** Adds a company to the database.
 * Returns json containing new company obj:
 * {company: {code, name, description}} */
router.post('/', async function (req, res, next) {
  const { code, name, description } = req.body;

  if (!(code && name && description)) {
    throw new BadRequestError();
  }

  let result;
  try {
    result = await db.query(
      `INSERT INTO companies (code, name, description)
      VALUES ($1, $2, $3)
      RETURNING code, name, description`,
      [code, name, description],
    );
  } catch {
    throw new BadRequestError("Company with that code already exists");
  }

  const company = result.rows[0];

  return res.status(201).json({ company });
});

/** Edits a company in the database.
 * Returns json containing edited company obj:
 * {company: {code, name, description}} */
router.put('/:code', async function (req, res, next) {
  const companyCode = req.params.code;
  const { name, description } = req.body;

  if (!(name && description)) {
    throw new BadRequestError();
  }

  const result = await db.query(
    `UPDATE companies
        SET name=$1, description=$2
        WHERE code=$3
        RETURNING code, name, description`,
    [name, description, companyCode],
  );

  const company = result.rows[0];

  if (!company) {
    throw new NotFoundError();
  }

  return res.json({ company });
});


/** Deletes a company in the database.
 * Returns json containing status of deleted company:
 * { status: "deleted" }*/
router.delete('/:code', async function (req, res, next) {

  const result = await db.query(
    "DELETE FROM companies WHERE code = $1 RETURNING name",
    [req.params.code],
  );

  if (!result.rows[0]) {
    throw new NotFoundError();
  }

  return res.json({ status: "deleted" });
});

module.exports = router;
