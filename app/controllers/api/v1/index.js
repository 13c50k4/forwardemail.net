/**
 * Copyright (c) Forward Email LLC
 * SPDX-License-Identifier: BUSL-1.1
 */

const aliases = require('./aliases');
const apple = require('./apple');
const domains = require('./domains');
const enforcePaidPlan = require('./enforce-paid-plan');
const inquiries = require('./inquiries');
const log = require('./log');
const lookup = require('./lookup');
const maxForwardedAddresses = require('./max-forwarded-addresses');
const paypal = require('./paypal');
const port = require('./port');
const restricted = require('./restricted');
const selfTest = require('./self-test');
const settings = require('./settings');
const stripe = require('./stripe');
const test = require('./test');
const users = require('./users');
const upgrade = require('./upgrade');
const emails = require('./emails');

module.exports = {
  aliases,
  apple,
  domains,
  enforcePaidPlan,
  inquiries,
  log,
  lookup,
  maxForwardedAddresses,
  paypal,
  port,
  restricted,
  selfTest,
  settings,
  stripe,
  test,
  users,
  upgrade,
  emails
};
