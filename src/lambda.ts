import * as Sentry from '@sentry/serverless'

import { assertEnvVar } from './utils/assertEnvVar'
import { findNewRealEstate } from './findNewRealEstate'

Sentry.AWSLambda.init({
  dsn: assertEnvVar('SENTRY_KEY'),
  autoSessionTracking: false,
})

export const handler = Sentry.AWSLambda.wrapHandler(findNewRealEstate)
