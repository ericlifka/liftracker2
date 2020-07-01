import { v4 as uuid4 } from 'uuid'
import { Promise } from 'es6-promise'

import { Lift, Cycle, CycleIncrement, WeightRound, Workout, Log } from './types'

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

  logs: {
    log_id: {
      lift_id: string,
      date: timestamp,
      weight: number,
      reps: number,
      orm: number,
    }
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
  loadLifts().then( (liftsDb: LiftsDB) => {
    const id = uuid4()
    const record: LiftRecord = { name, max, increment, round }

    liftsDb[ id ] = record
    localStorage.setItem('lifts', JSON.stringify(liftsDb))

    return recordToEntity<LiftRecord, Lift>(id, record)
  })

export const updateLift: (lift: Lift) => Promise<Lift> =
(lift) =>
  loadLifts().then( (liftsDb: LiftsDB) => {
    const record: LiftRecord =
      { name: lift.name
      , max: lift.max
      , increment: lift.increment
      , round: lift.round
      }

    liftsDb[ lift.id ] = record
    localStorage.setItem('lifts', JSON.stringify(liftsDb))

    return recordToEntity<LiftRecord, Lift>(lift.id, record)
  })



type CycleRecord =
  { [Workout.five]: boolean
  , [Workout.three]: boolean
  , [Workout.one]: boolean
  }

type CyclesDB =
  { [id: string]: CycleRecord
  }


const loadCycles: () => Promise<CyclesDB> =
  loadDbTable<CyclesDB>('cycles')

export const queryCycles: () => Promise<Cycle[]> =
  queryTable<CyclesDB, CycleRecord, Cycle>(loadCycles)

export const createCycle: (lift_id: string) => Promise<Cycle> =
(lift_id) =>
  loadCycles().then( (cyclesDb: CyclesDB) => {
    const record: CycleRecord =
      { [Workout.five]: null
      , [Workout.three]: null
      , [Workout.one]: null
      }

    cyclesDb[ lift_id ] = record
    localStorage.setItem('cycles', JSON.stringify(cyclesDb))

    return recordToEntity<CycleRecord, Cycle>(lift_id, record)
  })

export const updateCycle: (cycle: Cycle) => Promise<Cycle> =
(cycle) =>
  loadCycles().then( (cyclesDb: CyclesDB) => {
    const record: CycleRecord =
      { [Workout.five]: cycle[Workout.five]
      , [Workout.three]: cycle[Workout.three]
      , [Workout.one]: cycle[Workout.one]
      }

    cyclesDb[ cycle.id ] = record
    console.log('updating cycle ' + cycle.id)
    localStorage.setItem('cycles', JSON.stringify(cyclesDb))

    return recordToEntity<CycleRecord, Cycle>(cycle.id, record)
  })



type LogRecord =
  { lift_id: string
  , date: string
  , weight: number
  , reps: number
  , orm: number
  }

type LogsDB =
  { [id: string]: LogRecord
  }

const loadLogs: () => Promise<LogsDB> =
  loadDbTable<LogsDB>('logs')

export const queryLogs: () => Promise<Log[]> =
  queryTable<LogsDB, LogRecord, Log>(loadLogs)

export const createLog: (lift_id: string, date: string, weight: number, reps: number, orm: number) => Promise<Log> =
(lift_id, date, weight, reps, orm) =>
  loadLogs().then( (logsDb: LogsDB) => {
    const id = uuid4()
    const record: LogRecord = { lift_id, date, weight, reps, orm }

    logsDb[ id ] = record
    localStorage.setItem('logs', JSON.stringify(logsDb))

    return recordToEntity<LogRecord, Log>(id, record)
  })