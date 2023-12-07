import { StateProvider } from '../src/StateProvider'
import { sourceName } from '../src/sources/myHomeGe'

const reset = async () => {
  const state = new StateProvider(sourceName)
  await state.update({
    shown: [],
    lastVisitAt: 0,
  })
}

reset()
