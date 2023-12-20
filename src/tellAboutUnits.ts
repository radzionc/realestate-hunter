import { Unit } from './Unit'
import { assertEnvVar } from './utils/assertEnvVar'
import TelegramBot from 'node-telegram-bot-api'

export const tellAboutUnits = async (units: Unit[]) => {
  const telegramBotToken = assertEnvVar('TELEGRAM_BOT_TOKEN')
  const telegramChatId = assertEnvVar('TELEGRAM_BOT_CHAT_ID')

  const bot = new TelegramBot(telegramBotToken)

  await Promise.all(
    units.map(async (unit) => {
      const message = [
        `*${unit.name}*\n`,
        `📏 *m2:* ${unit.squireMeterPrice.toLocaleString()}$`,
        `💰 *Price:* ${unit.price.toLocaleString()}$`,
        `[View more](${unit.url})`,
      ].join('\n')

      await bot.sendMessage(telegramChatId, message, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [[{ text: 'View more', url: unit.url }]],
        },
      })

      if (unit.imageUrl) {
        await bot.sendPhoto(telegramChatId, unit.imageUrl)
      }
    })
  )
}
