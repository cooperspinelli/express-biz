"use strict";

const express = require('express');
const router = new express.Router();

const db = require("./db");


router.get("/", async function (req, res, next) {
  const companies = await db.getCompanies();
  return res.json({ companies });
});

router.get("/:code", async function (req, res, next) {
  const companyCode = req.params.code;
  const company = await db.getCompany(companyCode);
  // if company === undefined throw not found error
  return res.json({ company });
});



module.exports = router;
