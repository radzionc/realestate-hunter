import fetch from 'node-fetch'
import { load } from 'cheerio'
import { Unit } from '../Unit'
import { StateProvider } from '../StateProvider'
import { MyHomeGeSearch } from './MyHomeGeSearch'

const msInDay = 86400000

const searches: MyHomeGeSearch[] = [
  {
    url: `https://www.myhome.ge/en/s/Newly-finished-apartment-for-sale?Keyword=%E1%83%91%E1%83%90%E1%83%97%E1%83%A3%E1%83%9B%E1%83%98&AdTypeID=1&PrTypeID=1&regions=7.8.11.13&fullregions=7.8.11.13&districts=71.72.75.76&cities=15&EstateTypeID=1&FCurrencyID=1&FPriceTo=158000&AreaSizeFrom=62&FloorTo=15&FloorNums=notlast.notfirst&BedRoomNums=2.3`,
    ignoreStreets: ['chavchavadze', 'tbel-abuseri'],
    name: 'Batumi apartment',
  },
  {
    url: 'https://www.myhome.ge/en/s/House-for-Sale?Keyword=%E1%83%91%E1%83%90%E1%83%97%E1%83%A3%E1%83%9B%E1%83%98&AdTypeID=1&PrTypeID=2&cities=15&EstateTypeID=17&FCurrencyID=1&FPriceTo=200000',
    ignoreStreets: [],
    name: 'Batumi house',
  },
  {
    url: 'https://www.myhome.ge/ka/s/iyideba-saxli?Keyword=%E1%83%A5%E1%83%9D%E1%83%91%E1%83%A3%E1%83%9A%E1%83%94%E1%83%97%E1%83%98&AdTypeID=1&PrTypeID=2&cities=94&EstateTypeID=17&FCurrencyID=1&FPriceTo=200000',
    ignoreStreets: [],
    name: 'Kobuleti house',
  },
  {
    url: 'https://www.myhome.ge/ka/s/iyideba-axali-ashenebuli-bina?Keyword=%E1%83%A5%E1%83%9D%E1%83%91%E1%83%A3%E1%83%9A%E1%83%94%E1%83%97%E1%83%98&AdTypeID=1&PrTypeID=1&cities=94&EstateTypeID=1&FCurrencyID=1&FPriceTo=158000&AreaSizeFrom=62&FloorTo=15&FloorNums=notlast.notfirst&BedRoomNums=2.3',
    ignoreStreets: [],
    name: 'Kobuleti apartment',
  },
]

export const sourceName = 'myhome.ge'

const getUnitsFromPage = (search: MyHomeGeSearch, body: string) => {
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

    const squireMeterPrice = Number($card('.sq-price-usd').text())
    const price = Number($card('.item-price-usd').text().replace(',', ''))

    const imageUrl = $card('.swiper-lazy.card-img').attr('data-src')

    const unit: Unit = {
      name: search.name,
      url,
      id,
      createdAt: new Date(rawDateWithYear).getTime(),
      squireMeterPrice,
      price,
      imageUrl,
    }

    console.log(unit)

    units.push(unit)
  })

  return units
}

const getUnits = async (search: MyHomeGeSearch, postedAfter: number) => {
  const recursive = async (units: Unit[], page: number): Promise<Unit[]> => {
    const response = await fetch(`${search.url}&Page=${page}`)
    const body = await response.text()

    const newUnits = getUnitsFromPage(search, body)
      .filter((unit) => unit.createdAt > postedAfter)
      .filter((unit) =>
        search.ignoreStreets.every(
          (street) => !unit.url.toLowerCase().includes(street)
        )
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

  const units = (
    await Promise.all(
      searches.map((search) => getUnits(search, searchForUnitsPostedAfter))
    )
  ).flat()

  const newUnits = units.filter((a) => !state.shown.includes(a.id))

  await stateProvider.update({
    lastVisitAt: Date.now(),
    shown: [...state.shown, ...newUnits.map((unit) => unit.id)],
  })

  return newUnits
}
