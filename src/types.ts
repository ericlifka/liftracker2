
export type CycleIncrement
  = 5
  | 10

export type WeightRound
  = 1
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
  , [Workout.five]: boolean
  , [Workout.three]: boolean
  , [Workout.one]: boolean
  }

export const DefaultCycle: Cycle =
  { id: 'abc123'
  , [Workout.five]: false
  , [Workout.three]: false
  , [Workout.one]: false
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
