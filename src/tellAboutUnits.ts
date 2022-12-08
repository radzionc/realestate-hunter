import { Unit } from './Unit'
import { assertEnvVar } from './utils/assertEnvVar'
import TelegramBot from 'node-telegram-bot-api'

export const tellAboutUnits = async (units: Unit[]) => {
  const telegramBotToken = assertEnvVar('TELEGRAM_BOT_TOKEN')
  const telegramChatId = assertEnvVar('TELEGRAM_BOT_CHAT_ID')

  const bot = new TelegramBot(telegramBotToken)
  const message = units
    .map(
      (unit, index) => `${index + 1}. ${unit.squireMeterPrice} m2 ${unit.url}`
    )
    .join('\n')

  await bot.sendMessage(telegramChatId, message)
}
