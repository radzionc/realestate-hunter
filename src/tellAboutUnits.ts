import { Unit } from './Unit'
import { assertEnvVar } from './utils/assertEnvVar'
import TelegramBot from 'node-telegram-bot-api'

const telegramBotToken = assertEnvVar('TELEGRAM_BOT_TOKEN')
const telegramChatId = assertEnvVar('TELEGRAM_BOT_CHAT_ID')
const bot = new TelegramBot(telegramBotToken)

const sendUnit = async (unit: Unit) => {
  const message = [
    `*${unit.name}*\n`,
    `📏 *m2:* ${unit.squireMeterPrice.toLocaleString()}$`,
    `💰 *Price:* ${unit.price.toLocaleString()}$\n`,
    `${unit.url}`,
  ].join('\n')

  if (unit.imageUrl) {
    await bot.sendPhoto(telegramChatId, unit.imageUrl, {
      caption: message,
      parse_mode: 'Markdown',
    })
  } else {
    await bot.sendMessage(telegramChatId, message, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [[{ text: 'View more', url: unit.url }]],
      },
    })
  }
}

export const tellAboutUnits = async (units: Unit[]) => {
  await Promise.all(units.map(sendUnit))
}
