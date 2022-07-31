export interface SourceState {
  shown: string[]
  lastVisitAt?: number
}

export const defaultSourceState: SourceState = {
  shown: [],
}
