/**
 * Copyright (c) Forward Email LLC
 * SPDX-License-Identifier: BUSL-1.1
 */

const ms = require('ms');
const pWaitFor = require('p-wait-for');

const logger = require('#helpers/logger');

async function getMessage(imapClient, info, provider) {
  let received;
  let err;
  try {
    await pWaitFor(
      async () => {
        // TODO: IMAP Protocol Extension Support
        // TODO: render a page with each provider's capabilities
        // <https://gist.github.com/nevans/8ef449da0786f9d1cc7c8324a288dd9b>
        // /blog/smtp-capability-command-by-provider
        // /blog/smtp-jmap-capability-imaprev
        // console.log('capabilities', imapClient.capabilities);

        try {
          for await (const message of imapClient.fetch('*', {
            headers: ['Message-ID']
          })) {
            if (received) continue;
            if (
              message.headers
                .toString()
                .includes(
                  info.messageId.replace('<', '').replace('>', '').split('@')[1]
                )
            ) {
              //
              // NOTE: due to NTP time differences we cannot rely on
              //       a message's internal date from a given provider
              //       nor can we rely on Recieved headers
              //       nor can we rely on message envelope date
              //
              received = new Date();
            }
          }

          if (received) {
            try {
              await imapClient.messageDelete({ all: true });
            } catch (err) {
              err.isCodeBug = true;
              logger.fatal(err);
            }
          }
        } catch (_err) {
          err = _err;
        }

        if (err) throw err;

        return Boolean(received);
      },
      {
        interval: 0,
        timeout: ms('1m')
      }
    );
  } catch (_err) {
    err = _err;
  }

  return { provider, received, err };
}

module.exports = getMessage;
