import { Unit } from './Unit'
import { assertEnvVar } from './utils/assertEnvVar'
import TelegramBot from 'node-telegram-bot-api'

function makePortions<T>(arr: T[], portionSize: number) {
  const portions: T[][] = []

  arr.forEach((item, index) => {
    if (index % portionSize === 0) {
      portions.push([])
    }

    portions[portions.length - 1].push(item)
  })

  return portions
}

export const tellAboutUnits = async (units: Unit[]) => {
  const telegramBotToken = assertEnvVar('TELEGRAM_BOT_TOKEN')
  const telegramChatId = assertEnvVar('TELEGRAM_BOT_CHAT_ID')

  const bot = new TelegramBot(telegramBotToken)

  const portions = makePortions(units, 10)

  for (const portion of portions) {
    const message = portion
      .map(
        (unit, index) => `${index + 1}. ${unit.squireMeterPrice} m2 ${unit.url}`
      )
      .join('\n')

    await bot.sendMessage(telegramChatId, message)
  }
}
