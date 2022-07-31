type VariableName =
  | 'SENTRY_KEY'
  | 'TELEGRAM_BOT_TOKEN'
  | 'TELEGRAM_BOT_CHAT_ID'
  | 'STATE_TABLE_NAME'

export const assertEnvVar = (name: VariableName): string => {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing ${name} environment variable`)
  }

  return value
}
