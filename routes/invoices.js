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
//TODO: Refactor to JOIN query
router.get('/:id', async function (req, res, next) {
  const id = req.params.id;

  const invResults = await db.query(
    `SELECT id, amt, paid, add_date, paid_date, comp_code, name, description
          FROM invoices i
          JOIN companies c ON i.comp_code = c.code
          WHERE id=$1`, [id]);
  const invoice = invResults.rows[0];

  if (!invoice) {
    throw new NotFoundError();
  }

  const returnData = {
    invoice: {
      id: invoice.id,
      amt: invoice.amt,
      paid: invoice.paid,
      add_date: invoice.add_date,
      paid_date: invoice.paid_date,
      company: {
        name: invoice.name,
        descrition: invoice.description
      }
    }
  };

  return res.json(returnData);
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
  const { amt, paid } = req.body;

  if (amt === undefined || paid === undefined) {
    throw new BadRequestError();
  }

  const result = await db.query(
    `UPDATE invoices
    SET amt = $1,
        paid_date = (CASE
          WHEN paid = FALSE AND $2 = TRUE THEN CURRENT_DATE
          WHEN paid = TRUE AND $2 = FALSE THEN NULL
          ELSE paid_date
        END),
        paid = (CASE
          WHEN $2 = TRUE THEN TRUE
          WHEN $2 = FALSE THEN FALSE
          ELSE paid
        END)
      WHERE id= $3
      RETURNING id, comp_code, amt, paid, add_date, paid_date;`,
    [Number(amt), paid === "true", invoiceId]);

  const invoice = result.rows[0];

  if (!invoice) {
    throw new NotFoundError();
  }

  return res.json({ invoice });
});

/**
 * Deletes an invoice given an id
 * Returns: {status: "deleted"} or 404 if invoice wasn't found
 */
router.delete('/:id', async function (req, res, next) {

  const result = await db.query(
    "DELETE FROM invoices WHERE id = $1 RETURNING id",
    [req.params.id],
  );

  if (!result.rows[0]) {
    throw new NotFoundError();
  }

  return res.json({ status: "deleted" });

});



module.exports = router;