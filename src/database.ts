import { v4 as uuid4 } from 'uuid'
import { Promise } from 'es6-promise'

import { Lift, Cycle, CycleIncrement, WeightRound, Workout } from './types'

/* -- Schema Tables

  lifts: {
    lift_id: {
      id: string,
      name: string,
      max: number,
      increment: number,
      round: number
    },
    ...
  }

  cycles: {
    lift_id: {
      five: null | timestamp,
      three: null | timestamp,
      one: null | timestamp
    },
    ...
  }

  for each item:
  load[type]s   // load and parse localstorage data
  query[type]s  // converts schema to array of types
  create[type]  // create and save a new item of type

*/


// convert record types to entity types to keep a separation
// between what the db uses and the rest of the app
function recordToEntity<RT, T>(id: string, record: RT): T {
  return {
    id,
    ...record
  } as unknown as T
}

function loadDbTable<DBT>(table: string): () => Promise<DBT> {
  return () => new Promise( resolve => {
    let table_json = localStorage.getItem(table) || "{}"
    let db = JSON.parse(table_json) as DBT
    resolve(db)
  })
}

function queryTable<DBT, RT, T>(loader: () => Promise<DBT>): () => Promise<T[]> {
  return () =>
    loader().then( (db: DBT) =>
      Object.entries(db).map(([id, entity]: [string, RT]) =>
        recordToEntity<RT, T>(id, entity)))
}



type LiftRecord =
  { name: string
  , max: number
  , increment: number
  , round: number
  }

type LiftsDB =
  { [id: string]: LiftRecord
  }


const loadLifts: () => Promise<LiftsDB> =
  loadDbTable<LiftsDB>('lifts')

export const queryLifts: () => Promise<Lift[]> =
  queryTable<LiftsDB, LiftRecord, Lift>(loadLifts)

export const createLift: (name: string, max: number, increment: CycleIncrement, round: WeightRound) => Promise<Lift> =
(name, max, increment, round) =>
  loadLifts().then( (liftsDB: LiftsDB) => {
    const id = uuid4()
    const record: LiftRecord = { name, max, increment, round }

    liftsDB[ id ] = record
    localStorage.setItem('lifts', JSON.stringify(liftsDB))

    return recordToEntity<LiftRecord, Lift>(id, record)
  })



type CycleRecord =
  { [Workout.five]: null | Date
  , [Workout.three]: null | Date
  , [Workout.one]: null | Date
  }

type CyclesDB =
  { [lift_id: string]: CycleRecord
  }


const loadCycles: () => Promise<CyclesDB> =
  loadDbTable<CyclesDB>('cycles')

export const queryCycles: () => Promise<Cycle[]> =
  queryTable<CyclesDB, CycleRecord, Cycle>(loadCycles)

export const createCycle: (lift_id: string) => Promise<Cycle> =
(lift_id) =>
  loadCycles().then( (cyclesDB: CyclesDB) => {
    const record: CycleRecord =
      { [Workout.five]: null
      , [Workout.three]: null
      , [Workout.one]: null
      }

    cyclesDB[ lift_id ] = record
    localStorage.setItem('cycles', JSON.stringify(cyclesDB))

    return recordToEntity<CycleRecord, Cycle>(lift_id, record)
  })
