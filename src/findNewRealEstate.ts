import { getNewRealEstate } from './sources/myHomeGe'
import { tellAboutUnits } from './tellAboutUnits'

export const findNewRealEstate = async () => {
  const units = await getNewRealEstate()

  if (units.length) {
    await tellAboutUnits(units)
  }
}
