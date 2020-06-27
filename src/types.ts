
export type CycleIncrement
  = 5
  | 10

export type WeightRound
  = 1
  | 2.5
  | 5

export enum Workout
  { five = "5-5-5"
  , three = "3-3-3"
  , one = "5-3-1"
  , warmup = "warmup"
  }

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
  { id: string
  , [Workout.five]: null | Date
  , [Workout.three]: null | Date
  , [Workout.one]: null | Date
  }

export const DefaultCycle =
  { id: 'abc123'
  , [Workout.five]: null
  , [Workout.three]: null
  , [Workout.one]: null
  }

export type Lift =
  { id: string
  , name: string
  , max: number
  , increment: CycleIncrement
  , round: WeightRound
  }

export type Log =
  { id: string
  , lift_id: string
  , date: Date
  , weight: number
  , reps: number
  , orm: number
  }
