import fetch from 'node-fetch'
import { load } from 'cheerio'
import { Unit } from '../Unit'
import { StateProvider } from '../StateProvider'

const msInDay = 86400000

const sourceName = 'myhome.ge'
// const realEstateSearchPage = `https://www.myhome.ge/en/s/Newly-finished-apartment-for-sale-Batumi?Keyword=Batumi&AdTypeID=1&PrTypeID=1&mapC=41.6509502%2C41.6360085&mapOp=0&EnableMap=0&districts=776460995.776458944.776463102.776465448&cities=8742159&GID=8742159&EstateTypeID=1&FCurrencyID=1&FPriceTo=156000&AreaSizeFrom=62&FloorTo=13&FloorNums=notlast.notfirst`
// const realEstateSearchPage = `https://www.myhome.ge/ka/s/iyideba-bina?Keyword=%E1%83%91%E1%83%90%E1%83%97%E1%83%A3%E1%83%9B%E1%83%98&AdTypeID=1&PrTypeID=1&regions=7.8.11.13&fullregions=7.8.11.13&districts=71.72.75.76&cities=15&streets=Array&FCurrencyID=1&FPriceTo=158000&AreaSizeFrom=62&FloorTo=15&FloorNums=notlast.notfirst`
const realEstateSearchPage = `https://www.myhome.ge/en/s/iyideba-bina?Keyword=%E1%83%91%E1%83%90%E1%83%97%E1%83%A3%E1%83%9B%E1%83%98&AdTypeID=1&PrTypeID=1&regions=7.8.11.13&fullregions=7.8.11.13&districts=71.72.75.76&cities=15&streets=Array&FCurrencyID=1&FPriceTo=158000&AreaSizeFrom=62&FloorTo=15&FloorNums=notlast.notfirst`
const streetsToIgnore: string[] = ['Chavchavadze']

const getUnitsFromPage = (body: string) => {
  const $ = load(body)

  const year = new Date().getFullYear()

  const cards = $('.statement-card')
    .filter(':not(.banner)')
    .filter(':not(..ado_ban)')

  const units: Unit[] = []

  cards.toArray().map((card) => {
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

    const price = $card('.sq-price-usd').text()

    units.push({
      url,
      id,
      createdAt: new Date(rawDateWithYear).getTime(),
      squireMeterPrice: Number(price),
    })
  })

  return units
}

const getUnits = async (postedAfter: number) => {
  const recursive = async (units: Unit[], page: number): Promise<Unit[]> => {
    const response = await fetch(`${realEstateSearchPage}&Page=${page}`)
    const body = await response.text()

    const newUnits = getUnitsFromPage(body).filter(
      (unit) => unit.createdAt > postedAfter
    )

    if (newUnits.length < 1) return units

    return recursive([...units, ...newUnits], page + 1)
  }

  return await recursive([], 1)
}

export const getNewRealEstate = async (): Promise<Unit[]> => {
  const stateProvider = new StateProvider(sourceName)
  const state = await stateProvider.get()

  const searchForUnitsPostedAfter =
    state.lastVisitAt || Date.now() - msInDay * 2

  const units = (await getUnits(searchForUnitsPostedAfter))
    .filter((a) => !state.shown.includes(a.id))
    .filter((unit) =>
      streetsToIgnore.every((street) => !unit.url.includes(street))
    )

  await stateProvider.update({
    lastVisitAt: Date.now(),
    shown: [...state.shown, ...units.map((unit) => unit.id)],
  })

  return units.sort((a, b) => a.squireMeterPrice - b.squireMeterPrice)
}
