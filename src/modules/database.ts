import { v4 as uuid4 } from 'uuid'
import { Promise } from 'es6-promise'

/* -- Schema

  lifts: [ id_string, ... ]

  id: {
    id: string,
    name: string,
    max: number,
    increment: number
  }

*/

export type Lift =
  { id: string
  , name: string
  , max: number
  , increment: number
  }

export const queryLifts: () => Promise<Lift[]> =
() =>
  loadLifts()
  .then( ids => Promise.all(
    ids.map(loadLift))
  )

export const createLift: (name: string, max: number, increment: number) => Promise<Lift> =
(name, max, increment) => new Promise(resolve => {
  let lift =
    { id: uuid4()
    , name
    , max
    , increment
    }

  loadLifts().then( ids => {
    localStorage.setItem(lift.id, JSON.stringify(lift))
    localStorage.setItem('lifts', JSON.stringify([ ...ids, lift.id ]))

    resolve(lift)
  })
})

const loadLifts: () => Promise<string[]> =
() => new Promise(resolve => {
  let lifts = localStorage.getItem('lifts')
  resolve( lifts
            ? JSON.parse(lifts)
            : [] )
})

const loadLift: (id: string) => Promise<Lift> =
(id) => new Promise((resolve, reject) => {
  let lift = localStorage.getItem(id)
  if (lift)
    resolve( JSON.parse(lift) as Lift )
  else
    reject({ error: `No lift found for ${id}` })
})
