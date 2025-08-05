// This file configures the initialization of Sentry on the server side.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://160f4da433d29d3a0a75c7b2459afe7f@o4509753847709696.ingest.us.sentry.io/4509789473996800",

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  // Enable logging
  _experiments: {
    enableLogs: true,
  },

  // Integrate console logging
  integrations: [
    Sentry.consoleLoggingIntegration({ levels: ["log", "error", "warn"] }),
  ],

  // Add custom tags that will be added to all events
  initialScope: {
    tags: {
      component: "llms-generator",
      environment: process.env.NODE_ENV,
      runtime: "nodejs",
    },
  },
});