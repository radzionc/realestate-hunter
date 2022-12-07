import fetch from 'node-fetch'
import { load } from 'cheerio'
import { Unit } from '../Unit'
import { StateProvider } from '../StateProvider'

const msInDay = 86400000

const sourceName = 'myhome.ge'
const realEstateSearchPage = `https://www.myhome.ge/en/s/Apartment-for-sale-Tbilisi?Keyword=Tbilisi&AdTypeID=1&PrTypeID=1&mapC=41.70931%2C44.78487&mapZ=12&mapOp=1&EnableMap=0&regions=687586034.689678147.689701920.687611312.688350922.687602533&districts=26445359.2022621279.62672532.1650325628.2185664.5965823289.798496409.5469869&cities=1996871&GID=1996871&FCurrencyID=1&FPriceTo=110000&AreaSizeFrom=50&FloorNums=notlast.notfirst&BedRoomNums=2.3&action_map=on&RenovationID=1`

const getUnitsFromPage = (body: string) => {
  const $ = load(body)

  const year = new Date().getFullYear()

  const cards = $('.statement-card')
    .filter(':not(.banner)')
    .filter(':not(..ado_ban)')

  return cards
    .toArray()
    .map((card) => {
      const $card = load(card)
      const [rawId, rawDate] = $card('.d-block')
        .toArray()
        .map((el) => $(el).text())

      if (!rawId || !rawDate) return

      const [day, monthString, time] = rawDate.split(' ')
      const rawDateWithYear = [day, monthString, year, time].join(' ')
      const id = rawId.split(' ')[1]

      const url = $card('a:first').attr('href')
      if (!url) return

      return {
        url,
        id,
        createdAt: new Date(rawDateWithYear).getTime(),
      }
    })
    .filter((unit) => unit) as Unit[]
}

const getUnits = async (lastVisitAt: number) => {
  const recursive = async (units: Unit[], page: number): Promise<Unit[]> => {
    const response = await fetch(`${realEstateSearchPage}&Page=${page}`)
    const body = await response.text()

    const newUnits = getUnitsFromPage(body).filter(
      (unit) => unit.createdAt > lastVisitAt
    )
    if (newUnits.length < 1) return units

    return recursive([...units, ...newUnits], page + 1)
  }

  return await recursive([], 1)
}

export const getNewRealEstate = async (): Promise<Unit[]> => {
  const stateProvider = new StateProvider(sourceName)
  const state = await stateProvider.get()

  const units = (
    await getUnits(state.lastVisitAt || Date.now() - msInDay * 2)
  ).filter((a) => !state.shown.includes(a.id))

  await stateProvider.update({
    lastVisitAt: Date.now(),
    shown: [...state.shown, ...units.map((unit) => unit.id)],
  })

  return units
}
