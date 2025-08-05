// This file configures the initialization of Sentry for edge features (middleware, edge routes, and so on).
// The config you add here will be used whenever one of the edge features is loaded.
// Note that this config is serialized and sent to the client on each request,
// so it should not contain any sensitive information.

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://160f4da433d29d3a0a75c7b2459afe7f@o4509753847709696.ingest.us.sentry.io/4509789473996800",

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  // Add custom tags that will be added to all events
  initialScope: {
    tags: {
      component: "llms-generator",
      environment: process.env.NODE_ENV,
      runtime: "edge",
    },
  },
});