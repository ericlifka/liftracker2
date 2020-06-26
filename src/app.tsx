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
  { [Workout.warmup]:
    [ { percent: .4, reps: 5 }
    , { percent: .5, reps: 5 }
    , { percent: .6, reps: 3 }
    ]
  , [Workout.five]:
    [ { percent: .65, reps: 5 }
    , { percent: .75, reps: 5 }
    , { percent: .85, reps: 5 }
    ]
  , [Workout.three]:
    [ { percent: .7, reps: 3 }
    , { percent: .8, reps: 3 }
    , { percent: .9, reps: 3 }
    ]
  , [Workout.one]:
    [ { percent: .75, reps: 5 }
    , { percent: .85, reps: 3 }
    , { percent: .95, reps: 1 }
    ]
  }


enum Scene
  { index = 'index'
  , create = 'create'
  , workout = 'workout'
  , log = 'log'
  }

type IndexParams = null
type CreateParams = null
type WorkoutParams =
  { lift: Lift
  , workout: Workout
  }
type LogParams =
  { lift: Lift
  , workout: Workout
  , movement: Movement
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

type LogScene =
  { scene: Scene.log
  , params: LogParams
  }
const logScene: (lift: Lift, workout: Workout, movement: Movement) => LogScene =
(lift, workout, movement) => (
  { scene: Scene.log
  , params: { lift, workout, movement }
  })

type ActiveScene
  = IndexScene
  | CreateScene
  | WorkoutScene
  | LogScene


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
  return <div className="app-layout">
    {(() => { switch (activeScene.scene) {
      case Scene.index: return indexView(activeScene.params, model)
      case Scene.create: return createView(activeScene.params, model)
      case Scene.workout: return workoutView(activeScene.params, model)
      case Scene.log: return logView(activeScene.params, model)
    }})()}
  </div>
}


const indexView: (params: IndexParams, model: Model) => Html =
(params, model) => <>
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
</>


const createView: (params: CreateParams, model: Model) => Html =
(params, model) => <>
  {topBar("Create Lift", navigate(indexScene()), true)}
  <div className="content">
    <CreateLiftForm />
  </div>
</>


const workoutView: (params: WorkoutParams, model: Model) => Html =
({ lift, workout }, model) => <>
  {topBar(`${lift.name}`, navigate(indexScene()))}
  <div className="content">
    <div className="card-list">
      {generateWorkout(lift, workout)}
    </div>
  </div>
</>


const logView: (params: LogParams, model: Model) => Html =
({ lift, workout, movement }, model) => <>
  {topBar(`Log Workout`, navigate(indexScene()), true)}
  <LogWorkoutForm lift={lift} workout={workout} movement={movement} />
</>



// -- View Helpers


const topBar: (title: string, back?: NavigateAction | undefined, isContextForm?: boolean) => Html =
(title, back, isContextForm = false) =>
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


const generateWorkout: (lift: Lift, workout: Workout) => Html =
(lift, workout) => {
  let { max, round } = lift
  let warmupMovements: Movement[] = applyWorkoutSpec(max, Bar, CommonPlates, round, WorkoutSpecs['warmup'])
  let workoutMovements: Movement[] = applyWorkoutSpec(max, Bar, CommonPlates, round, WorkoutSpecs[workout])
  let lastSet = workoutMovements[ workoutMovements.length - 1 ]

  return <>
    {workoutCard('Warmup', warmupMovements)}
    {workoutCard(`Workout - ${workout}+`, workoutMovements, true)}
    <button className="primary-action right"
            onClick={() => dispatch(navigate(logScene(lift, workout, lastSet)))}>
      <i className="material-icons">done</i>
    </button>
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
                onClick={() => dispatch(navigate(workoutScene(lift, Workout.five)))}>
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

  const save = e => {
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
      <input id="lift-name" type="text" placeholder="lift name"
             value={lift}
             onChange={e => setLift(e.target.value)} />
    </div>

    <div className="form-input">
      <label htmlFor="max-value">Training max</label>
      <input id="max-value" type="number" placeholder="current max"
             value={max}
             onChange={e => setMax(e.target.value)} />
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


const LogWorkoutForm: (props: { lift: Lift, workout: Workout, movement: Movement }) => Html =
({ lift, workout, movement }) => {
  const [weight, setWeight] = useState<number>(movement.weight)
  const [reps, setReps] = useState<number>(movement.reps)

  const save = e => {
    e.preventDefault()
  }

  return <form onSubmit={e => save(e)}>
    <div className="form-input">
      <label htmlFor="lift-weight">Weight</label>
      <input id="lift-name" type="number"
             value={weight}
             onChange={e => setWeight(parseInt(e.target.value, 10))} />
    </div>

    <div className="form-input">
      <label htmlFor="lift-weight">Reps</label>
      <input id="lift-name" type="number"
             value={reps}
             onChange={e => setReps(parseInt(e.target.value, 10))} />
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
