
export type CycleIncrement
  = 5
  | 10

export type WeightRound
  = 1
  | 2.5
  | 5

export type Workout
  = "5-5-5"
  | "3-3-3"
  | "5-3-1"
  | "warmup"

export type MovementSpec =
  { percent: number
  , reps: number
  }

export type Movement =
  { weight: number
  , reps: number
  , plates: number[]
  }

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
