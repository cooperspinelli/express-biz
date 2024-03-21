"use strict";

const express = require('express');
const router = new express.Router();

const db = require("../db");
const { NotFoundError } = require('../expressError');

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



module.exports = router;