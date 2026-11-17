'use strict';

// Server-side configuration only: never include this file in an HTML script tag.
const email = 'hrithikrana216@gmail.com';

module.exports = {
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  requireTLS: true,
  auth: {
    user: email,
    // Set the real Gmail App Password in the server environment, never in this file.
    pass: process.env.MOMZ14_SMTP_PASSWORD || 'DUMMY_APP_PASSWORD',
  },
  from: email,
  to: 'hrithikrana216@gmail.com',
};
