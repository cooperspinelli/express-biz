"use strict";

const express = require('express');
const router = new express.Router();

const db = require("../db");
const { NotFoundError, BadRequestError } = require('../expressError');

/** Returns json containing all invoices
 * return json with like {invoices: [{id, comp_code}, ...]}
 * */
router.get('/', async function (req, res, next) {
  const results = await db.query(
    `SELECT id, comp_code
         FROM invoices`);
  const invoices = results.rows;
  return res.json({ invoices });
});

/**
 * Returns an object of a given invoice:
 * e.g. {invoice: {id, amt, paid, add_date, paid_date,
 * company: {code, name, description}}
 * If invoice cannot be found, returns 404
 */
router.get('/:id', async function (req, res, next) {
  const id = req.params.id;

  const invResults = await db.query(
    `SELECT id, amt, paid, add_date, paid_date, comp_code
          FROM invoices
          WHERE id=$1`, [id]);
  const invoice = invResults.rows[0];

  if (!invoice) {
    throw new NotFoundError();
  }

  const compResults = await db.query(
    `SELECT code, name, description
      FROM companies
      WHERE code= $1`, [invoice.comp_code]);
  const company = compResults.rows[0];

  invoice.company = company;
  delete invoice.comp_code;
  return res.json({ invoice });
});


/**
 * Adds an invoice to the database:
 * Expects {comp_code, amt}
 * Returns {invoice: {id, comp_code, amt, paid, add_date, paid_date}}
 */
router.post('/', async function (req, res, next) {
  const { comp_code, amt } = req.body;

  if (!(comp_code && (amt !== undefined))) {
    throw new BadRequestError();
  }

  let result;
  try {
    result = await db.query(
      `INSERT INTO invoices (comp_code, amt)
      VALUES ($1, $2)
      RETURNING id, comp_code, amt, paid, add_date, paid_date`,
      [comp_code, Number(amt)]);
  } catch {
    throw new BadRequestError();
  }

  const invoice = result.rows[0];

  return res.json({ invoice });
});


/**
 * Updates an invoice in the database:
 * Expects {amt}
 * Returns {invoice: {id, comp_code, amt, paid, add_date, paid_date}}
 */
router.put('/:id', async function (req, res, next) {
  const invoiceId = req.params.id;
  const { amt } = req.body;

  if (amt === undefined) {
    throw new BadRequestError();
  }

  const result = await db.query(
    `UPDATE invoices
      SET amt=$1
      WHERE id=$2
      RETURNING id, comp_code, amt, paid, add_date, paid_date`,
    [Number(amt), invoiceId]);

  const invoice = result.rows[0];

  if (!invoice) {
    throw new NotFoundError();
  }

  return res.json({ invoice });
});



module.exports = router;