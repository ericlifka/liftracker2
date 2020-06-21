
export type CycleIncrement
  = 5
  | 10

export type WeightRound
  = 1
  | 2.5
  | 5

export type Cycle =
  { lift_id: string
  , five: null | Date
  , three: null | Date
  , one: null | Date
  }

export type Lift =
  { id: string
  , name: string
  , max: number
  , increment: CycleIncrement
  , round: WeightRound
  }
