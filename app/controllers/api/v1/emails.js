/**
 * Copyright (c) Forward Email LLC
 * SPDX-License-Identifier: BUSL-1.1
 */

const _ = require('lodash');
const pickOriginal = require('@ladjs/pick-original');

const Emails = require('#models/emails');
const config = require('#config');
const createSession = require('#helpers/create-session');
const toObject = require('#helpers/to-object');

function json(email, isList = false) {
  const object = toObject(Emails, email);
  if (isList) {
    delete object.headers;
    delete object.accepted;
    delete object.rejectedErrors;
  }

  return {
    ...pickOriginal(
      object,
      _.isFunction(email.toObject) ? email.toObject() : email
    ),
    // add a helper url
    link: `${config.urls.web}/my-account/emails/${email.id}`
  };
}

async function list(ctx) {
  ctx.body = ctx.state.emails.map((email) => json(email, true));
}

async function retrieve(ctx) {
  const body = json(ctx.state.email);
  // we want to return the `message` property
  body.message = await Emails.getMessage(ctx.state.email.message);
  ctx.body = body;
}

async function create(ctx) {
  try {
    if (!_.isPlainObject(ctx.request.body))
      throw new Error('Body must be an object');

    // <https://nodemailer.com/message/>
    const message = _.pick(ctx.request.body, [
      'from',
      'to',
      'cc',
      'bcc',
      'subject',
      'text',
      'html',
      'attachments',

      'sender',
      'replyTo',
      'inReplyTo',
      'references',

      // envelope (handled below)

      'attachDataUrls',
      'watchHtml',
      'amp',

      'icalEvent',
      'alternatives',
      'encoding',
      'raw',
      'textEncoding',
      'priority',
      'headers',
      'messageId',
      'date',
      'list'

      // dkim (handled by sending job)
    ]);

    // ensure `message.attachments` is an Array if it was set
    if (
      typeof message.attachments !== 'undefined' &&
      !Array.isArray(message.attachments)
    )
      throw new Error(
        'Attachments option "attachments" must be an Array if set'
      );

    // safeguard to filter out any attachments to prevent fs access
    if (
      Array.isArray(message.attachments) &&
      message.attachments.some((a) => a.path || a.href)
    )
      throw new Error('"attachments" cannot use "path" nor "href" properties');

    // safeguard to filter text/html from using "path" and "href" options
    if (
      _.isObject(message.text) &&
      (message?.text?.path || message?.text?.href)
    )
      throw new Error('"text" cannot use "path" nor "href" properties');

    if (
      _.isObject(message.html) &&
      (message?.html?.path || message?.html?.href)
    )
      throw new Error('"html" cannot use "path" nor "href" properties');

    if (
      _.isObject(message.watchHtml) &&
      (message?.watchHtml?.path || message?.watchHtml?.href)
    )
      throw new Error('"watchHtml" cannot use "path" nor "href" properties');

    // file and url access override for security
    message.disableFileAccess = true;
    message.disableUrlAccess = true;

    // TODO: rate limiting emails per day by domain id and alias user id

    // queue the email
    const email = await Emails.queue(
      { message, user: ctx.state.user },
      ctx.locale
    );

    ctx.logger.info('email created', {
      session: createSession(email),
      user: email.user,
      email: email._id,
      domains: [email.domain],
      ignore_hook: false
    });

    ctx.body = email;
  } catch (err) {
    ctx.logger.error(err);
    ctx.throw(err);
  }
}

module.exports = { list, retrieve, create };
