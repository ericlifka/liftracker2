import React, { useState } from "react"
import ReactDOM from "react-dom"
import { createStore, applyMiddleware } from "redux"
import thunkMiddleware from 'redux-thunk'
import { createLogger as createLoggerMiddleware } from 'redux-logger'
import { Promise } from 'es6-promise'

import { createLift, queryLifts, createCycle, queryCycles } from './database'
import { Lift, CycleIncrement, Workout, WeightRound, Cycle, Movement, MovementSpec } from './types'
import './styles.less'



// -- Models


const Bar: number =
  45

const CommonPlates: number[] =
  [ 45, 25, 10, 5, 2.5 ]

const WorkoutSpecs: { [s: string]: MovementSpec[] } =
  { 'warmup':
    [ { percent: .4, reps: 5 }
    , { percent: .5, reps: 5 }
    , { percent: .6, reps: 3 }
    ]
  , '5-5-5':
    [ { percent: .65, reps: 5 }
    , { percent: .75, reps: 5 }
    , { percent: .85, reps: 5 }
    ]
  , '3-3-3':
    [ { percent: .7, reps: 3 }
    , { percent: .8, reps: 3 }
    , { percent: .9, reps: 3 }
    ]
  , '5-3-1':
    [ { percent: .75, reps: 5 }
    , { percent: .85, reps: 3 }
    , { percent: .95, reps: 1 }
    ]
  }


enum Scene
  { index = 'index'
  , create = 'create'
  , workout = 'workout'
  }

type IndexParams = null
type CreateParams = null
type WorkoutParams =
  { lift: Lift
  , workout: Workout
  }

type IndexScene =
  { scene: Scene.index
  , params: IndexParams
  }
const indexScene: () => IndexScene =
() => (
  { scene: Scene.index
  , params: null
  })

type CreateScene =
  { scene: Scene.create
  , params: CreateParams
  }
const createScene: () => CreateScene =
() => (
  { scene: Scene.create
  , params: null
  })

type WorkoutScene =
  { scene: Scene.workout
  , params: WorkoutParams
  }
const workoutScene: (lift: Lift, workout: Workout) => WorkoutScene =
(lift, workout) => (
  { scene: Scene.workout
  , params: { lift, workout }
  })

type ActiveScene
  = IndexScene
  | CreateScene
  | WorkoutScene


type Model =
  { activeScene: ActiveScene
  , lifts: Lift[]
  , cycles: Cycle[]
  }

const init: () => Model =
() => (
  { activeScene: indexScene()
  , lifts: []
  , cycles: []
  })



// -- Update

enum Action
  { navigate = 'navigate'
  , setData = 'setData'
  , addLift = 'addLift'
  }


type NavigateAction =
  { type: Action.navigate
  , scene: ActiveScene
  }
const navigate: (scene: ActiveScene) => NavigateAction =
(scene) => (
  { type: Action.navigate
  , scene
  })


type SetDataAction =
  { type: Action.setData
  , lifts: Lift[]
  , cycles: Cycle[]
  }
const setData: (lifts: Lift[], cycles: Cycle[]) => SetDataAction =
(lifts, cycles) => (
  { type: Action.setData
  , lifts
  , cycles
  })

type AddLiftAction =
  { type: Action.addLift
  , lift: Lift
  , cycle: Cycle
  }
const addLift: (lift: Lift, cycle: Cycle) => AddLiftAction =
(lift, cycle) => (
  { type: Action.addLift
  , lift
  , cycle
  })


type Msg
  = NavigateAction
  | SetDataAction
  | AddLiftAction

const update: (model: Model, msg: Msg) => Model =
(model, msg) => {
  switch (msg.type) {
    case Action.navigate: return(
      { ...model
      , activeScene: { ...msg.scene }
      })

    case Action.setData: return (
      { ...model
      , lifts: [ ...msg.lifts ]
      , cycles: [ ...msg.cycles ]
      })

    case Action.addLift: return (
      { ...model
      , lifts: [ ...model.lifts, msg.lift ]
      , cycles: [ ...model.cycles, msg.cycle ]
      })

    default: return model
  }
}



// -- Async


const loadData: () => (dispatch: Function) => Promise<void> =
() => dispatch =>
  Promise.all([ queryLifts(), queryCycles() ]).then(([ lifts, cycles ]) =>
    dispatch(setData(lifts, cycles)))

const newLift: (name: string, max: number, increment: CycleIncrement, round: WeightRound) => (dispatch: Function) => Promise<void> =
(name, max, increment, round) => dispatch =>
  createLift(name, max, increment, round).then( lift =>
    createCycle(lift.id).then ( cycle =>
      dispatch(addLift(lift, cycle))))



// -- Store


const middleware = applyMiddleware(thunkMiddleware, createLoggerMiddleware())
const store = createStore(update, init(), middleware)
const { dispatch: storeDispatch, getState, subscribe } = store
const dispatch = (dispatchable: Msg | Function) => storeDispatch<any>(dispatchable)



// -- View


type Html = JSX.Element


const View: () => Html =
() => {
  const [model, setModel] = useState<Model>(getState())
  subscribe(() => setModel(getState()))

  return <App model={model} />
}


const App: (props: { model: Model }) => Html =
({ model }) => {
  let { activeScene } = model
  switch (activeScene.scene) {
    case Scene.index: return indexView(activeScene.params, model)
    case Scene.create: return createView(activeScene.params, model)
    case Scene.workout: return workoutView(activeScene.params, model)
  }
}


const indexView: (params: IndexParams, model: Model) => Html =
(params, model) =>
  <div className="app-layout">
    {topBar("liftracker")}
    <div className="content">
      <div className="card-list">
        {model.lifts.map( lift =>
          <LiftLinkCard key={lift.id} lift={lift} />
        )}
      </div>
    </div>
    <button className="primary-action center"
            onClick={() => dispatch(navigate(createScene()))}>
      <i className="material-icons">add</i>
    </button>
  </div>


const createView: (params: CreateParams, model: Model) => Html =
(params, model) =>
  <div className="app-layout">
    {topBar("Create Lift", true, navigate(indexScene()))}
    <div className="content">
      <CreateLiftForm />
    </div>
  </div>


const workoutView: (params: WorkoutParams, model: Model) => Html =
({ lift, workout }, model) =>
  <div className="app-layout">
    {topBar(`${lift.name} ${workout}`, true, navigate(indexScene()))}
    <div className="content">
      <div className="card-list">
        {generateWorkout(workout, lift.max, lift.round)}
      </div>
    </div>
  </div>



// -- View Helpers


const topBar: (title: string, isContextForm?: boolean, back?: NavigateAction | undefined) => Html =
(title, isContextForm = false, back) =>
  <div className={isContextForm ? "top-bar context-form" : "top-bar"}>
    {back &&
      <button className="navigation" onClick={() => dispatch(back)}>
        <i className="material-icons">arrow_back</i>
      </button>
    }
    <div className="title">{title}</div>
    <button className="navigation right">
      <i className="material-icons">show_chart</i>
    </button>
    <button className="navigation right">
      <i className="material-icons">settings</i>
    </button>
  </div>


const generateWorkout: (workoutName: Workout, max: number, round: WeightRound) => Html =
(workoutName, max, round) => {
  let warmup: Movement[] = applyWorkoutSpec(max, Bar, CommonPlates, round, WorkoutSpecs['warmup'])
  let workout: Movement[] = applyWorkoutSpec(max, Bar, CommonPlates, round, WorkoutSpecs[workoutName])

  return <>
    {workoutCard('Warmup', warmup)}
    {workoutCard('Workout', workout, true)}
  </>
}


const workoutCard: (title: string, movements: Movement[], plusSet?: boolean) => Html =
(title, movements, plusSet) =>
  <div className="card workout">
    <div className="row title">{title}</div>
    {movements.map(({ weight, reps, plates }, index) =>
      <div className="row movement-description" key={index}>
        <span className="weight">{weight}<i>lbs</i></span>
        <span className="reps">x{reps}{isLast(!!plusSet, index, movements) && "+"}</span>
        <span className="plates">[ {plates.join(', ')} ]</span>
      </div>
    )}
  </div>


// -- Components


const LiftLinkCard : (props: { lift: Lift }) => Html =
({ lift }) =>
  <div className="card">
    <div className="row">
      <div className="left">
        <div className="title">{lift.name}</div>
        <div className="secondary-actions">
          <button className="direct-set-link">
            <span>5-5-5</span>
          </button>
          <button className="direct-set-link">
            <span>3-3-3</span>
          </button>
          <button className="direct-set-link done">
            <span>5-3-1</span>
            <i className="material-icons">done</i>
          </button>
        </div>
      </div>
      <div className="right">
        <button className="next-set-link"
                onClick={() => dispatch(navigate(workoutScene(lift, "5-5-5")))}>
          <i className="material-icons">arrow_forward_ios</i>
        </button>
      </div>
    </div>
  </div>


const CreateLiftForm: (props: { }) => Html =
(props) => {
  const [lift, setLift] = useState<string>("")
  const [max, setMax] = useState<string>("")
  const [increment, setIncrement] = useState<string>("5")
  const [round, setRound] = useState<string>("5")

  const save = (e) => {
    e.preventDefault()

    const create = newLift(
      lift,
      parseInt(max, 10),
      parseInt(increment, 10) as CycleIncrement,
      parseInt(round, 10) as WeightRound)

    dispatch(create).then( () =>
      dispatch(navigate(indexScene())))
  }

  return <form onSubmit={e => save(e)}>
    <div className="form-input">
      <label htmlFor="lift-name">Lift name</label>
      <input id="lift-name" type="text" value={lift} placeholder="benchpress" onChange={e => setLift(e.target.value)} />
    </div>

    <div className="form-input">
      <label htmlFor="max-value">Training max</label>
      <input id="max-value" type="number" value={max} placeholder="135" onChange={e => setMax(e.target.value)} />
    </div>

    <div className="form-input">
      <label htmlFor="max-value">Set increment</label>
      <select value={increment} onChange={e => setIncrement(e.target.value)}>
        <option value="5">5 lbs</option>
        <option value="10">10 lbs</option>
      </select>
    </div>

    <div className="form-input">
      <label htmlFor="max-value">Round to</label>
      <select value={round} onChange={e => setRound(e.target.value)}>
        <option value="5">5 lbs</option>
        <option value="2.5">2.5 lbs</option>
        <option value="1">1 lbs</option>
      </select>
    </div>

    <button className="primary-action right" type="submit">
      <i className="material-icons">check</i>
    </button>
  </form>
}



// -- Utilities

const isLast: (flag: boolean, i: number, list: any[]) => boolean =
(flag, i, list) =>
  flag && i === list.length - 1

const oneRepEstimate: (weight: number, reps: number) => number =
(weight, reps) => Math.round(
  weight * ( 1 + Math.min(reps, 12) / 30 ))


const calcPlates: (plates: number[], remaining: number) => number[] =
(plates, remaining) => {
  if (plates.length === 0 || remaining <= 0)
    return []

  let [ largest, ...rest ] = plates

  if (2 * largest > remaining)
    return calcPlates(rest, remaining)
  else
    return [ largest
           , ...calcPlates(plates, remaining - (2 * largest))
           ]
}

const roundToFactor: (weight: number, factor?: number, half?: number) => number =
(weight, factor = 5, half = factor / 2) =>
  factor * Math.floor( (weight + half) / factor )

const applyWorkoutSpec: ( max: number
                        , bar: number
                        , userPlates: number[]
                        , rounding: WeightRound
                        , spec: MovementSpec[]) => Movement[] =
(max, bar, userPlates, rounding, spec) =>
  spec.map(movement => {
    let appliedWeight = roundToFactor(movement.percent * max, rounding)
    let weight = Math.max(appliedWeight, bar)
    let plates = calcPlates(userPlates, weight - bar)

    return { reps: movement.reps
           , weight
           , plates
           }
  })



// -- Main

const main: () => void =
() => {
  ReactDOM.render(
    <View />,
    document.getElementById("root"))

  dispatch(loadData())
}


main()
