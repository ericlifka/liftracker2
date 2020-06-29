import React, { useState, useEffect } from "react"
import ReactDOM from "react-dom"
import { createStore, applyMiddleware, Dispatch } from "redux"
import thunkMiddleware from 'redux-thunk'
import { createLogger as createLoggerMiddleware } from 'redux-logger'
import "regenerator-runtime/runtime.js";

import { createLift, queryLifts, updateLift, createCycle, queryCycles, updateCycle, createLog, queryLogs } from './database'
import { Lift, CycleIncrement, Workout, WeightRound, Cycle, DefaultCycle, Movement, MovementSpec, Log } from './types'
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
  { loading = 'loading'
  , index = 'index'
  , create = 'create'
  , edit = 'edit'
  , workout = 'workout'
  , log = 'log'
  , finishCycle = 'finishCycle'
  , settings = 'settings'
  }

type LoadingParams = null
type IndexParams = null
type CreateParams = null
type EditParams =
  { lift: Lift
  }
type WorkoutParams =
  { lift: Lift
  , workout: Workout
  }
type LogParams =
  { lift: Lift
  , workout: Workout
  , movement: Movement
  }
type FinishCycleParams = null
type SettingsParams = null

type LoadingScene =
  { scene: Scene.loading
  , params: LoadingParams
  }
const loadingScene: () => LoadingScene =
() => (
  { scene: Scene.loading
  , params: null
  })

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

type EditScene =
  { scene: Scene.edit
  , params: EditParams
  }
const editScene: (lift: Lift) => EditScene =
(lift) => (
  { scene: Scene.edit
  , params: { lift }
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

type FinishCycleScene =
  { scene: Scene.finishCycle
  , params: FinishCycleParams
  }
const finishCycleScene: () => FinishCycleScene =
() => (
  { scene: Scene.finishCycle
  , params: null
  })

type SettingsScene =
  { scene: Scene.settings
  , params: SettingsParams
  }
const settingsScene: () => SettingsScene =
() => (
  { scene: Scene.settings
  , params: null
  })

type ActiveScene
  = LoadingScene
  | IndexScene
  | CreateScene
  | EditScene
  | WorkoutScene
  | LogScene
  | FinishCycleScene
  | SettingsScene


type Model =
  { activeScene: ActiveScene
  , sceneStack: ActiveScene[]
  , lifts: Lift[]
  , cycles: Cycle[]
  , logs: Log[]
  }

const init: () => Model =
() => (
  { activeScene: loadingScene()
  , sceneStack: []
  , lifts: []
  , cycles: []
  , logs: []
  })



// -- Update

enum Action
  { navigate = 'navigate'
  , navigateBack = 'navigateBack'
  , setData = 'setData'
  , addLift = 'addLift'
  , addLog = 'addLog'
  , cycleUpdated = 'cycleUpdated'
  , liftUpdated = 'liftUpdated'
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

type NavigateBackAction =
  { type: Action.navigateBack
  }
const navigateBack: () => NavigateBackAction =
() => (
  { type: Action.navigateBack
  })


type SetDataAction =
  { type: Action.setData
  , lifts: Lift[]
  , cycles: Cycle[]
  , logs: Log[]
  }
const setData: (lifts: Lift[], cycles: Cycle[], logs: Log[]) => SetDataAction =
(lifts, cycles, logs) => (
  { type: Action.setData
  , lifts
  , cycles
  , logs
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

type AddLogAction =
  { type: Action.addLog
  , log: Log
  }
const addLog: (log: Log) => AddLogAction =
(log) => (
  { type: Action.addLog
  , log
  })

type CycleUpdatedAction =
  { type: Action.cycleUpdated
  , cycle: Cycle
  }
const cycleUpdated: (cycle: Cycle) => CycleUpdatedAction =
(cycle) => (
  { type: Action.cycleUpdated
  , cycle
  })

type LiftUpdatedAction =
  { type: Action.liftUpdated
  , lift: Lift
  }
const liftUpdated: (lift: Lift) => LiftUpdatedAction =
(lift) => (
  { type: Action.liftUpdated
  , lift
  })


type Msg
  = NavigateAction
  | NavigateBackAction
  | SetDataAction
  | AddLiftAction
  | AddLogAction
  | CycleUpdatedAction
  | LiftUpdatedAction

const update: (model: Model, msg: Msg) => Model =
(model, msg) => {
  switch (msg.type) {
    case Action.navigate: return (
      { ...model
      , activeScene: { ...msg.scene }
      , sceneStack: [ model.activeScene, ...model.sceneStack ]
      })

    case Action.navigateBack: return (
      { ...model
      , activeScene: model.sceneStack[ 0 ] || indexScene()
      , sceneStack: model.sceneStack.slice(1)
      })

    case Action.setData: return (
      { ...model
      , lifts: [ ...msg.lifts ]
      , cycles: [ ...msg.cycles ]
      , logs: [ ...msg.logs ]
      })

    case Action.addLift: return (
      { ...model
      , lifts: [ ...model.lifts, msg.lift ]
      , cycles: [ ...model.cycles, msg.cycle ]
      })

    case Action.addLog: return (
      { ...model
      , logs: [ msg.log, ...model.logs ]
      })

    case Action.cycleUpdated: return (
      { ...model
      , cycles: model.cycles.map( cycle =>
          cycle.id === msg.cycle.id
            ? { ...msg.cycle }
            : cycle )
      })

    case Action.liftUpdated: return (
      { ...model
      , lifts: model.lifts.map( lift =>
          lift.id === msg.lift.id
            ? { ...msg.lift }
            : lift )
      })

    default: return model
  }
}



// -- Async


const loadData: () => (dispatch: Dispatch) => Promise<void> =
() => async dispatch => {
  let lifts = await queryLifts()
  let cycles = await queryCycles()
  let logs = await queryLogs()

  dispatch(setData(lifts, cycles, logs))
}

const newLift: (name: string, max: number, increment: CycleIncrement, round: WeightRound) => (dispatch: Dispatch) => Promise<void> =
(name, max, increment, round) => async dispatch => {
  let lift = await createLift(name, max, increment, round)
  let cycle = await createCycle(lift.id)

  dispatch(addLift(lift, cycle))
}

const editLift: (lift: Lift, name: string, max: number, increment: CycleIncrement, round: WeightRound) => (dispatch: Dispatch) => Promise<void> =
(lift, name, max, increment, round) => async dispatch => {
  let newLift = await updateLift({ id: lift.id, name, max, increment, round })
  dispatch(liftUpdated(newLift))
}

const logWorkout: (lift: Lift, workout: Workout, weight: number, reps: number, orm: number) => (dispatch: Dispatch, getState: Function) => Promise<void> =
(lift, workout, weight, reps, orm) => async (dispatch, getState) => {
  let log = await createLog(lift.id, new Date(), weight, reps, orm)
  dispatch(addLog(log))

  let cycle = getById<Cycle>(getState().cycles, lift.id)
  if (!cycle) {
    cycle = await createCycle(lift.id)
  }

  let newCycle = await updateCycle({ ...cycle, [workout]: true })
  dispatch(cycleUpdated(newCycle))
}

const startNewCycle: (increasesMaxes: boolean) => (dispatch: Dispatch, getState: Function) => Promise<void> =
(incraseMaxes) => async (dispatch, getState) => {
  let { lifts, cycles } = getState()
  for (let cycle of cycles) {
    let newCycle = await updateCycle({ ...DefaultCycle, id: cycle.id })
    dispatch(cycleUpdated(newCycle))
  }

  if (incraseMaxes) {
    for (let lift of lifts) {
      let newLift = await updateLift({ ...lift, max: lift.max + lift.increment })
      dispatch(liftUpdated(newLift))
    }
  }
}



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
      case Scene.loading: return loadingView(activeScene.params, model)
      case Scene.index: return indexView(activeScene.params, model)
      case Scene.create: return createView(activeScene.params, model)
      case Scene.edit: return editView(activeScene.params, model)
      case Scene.workout: return workoutView(activeScene.params, model)
      case Scene.log: return logView(activeScene.params, model)
      case Scene.finishCycle: return finishCycleView(activeScene.params, model)
      case Scene.settings: return settingsView(activeScene.params, model)
    }})()}
  </div>
}


const loadingView: (params: LoadingParams, model: Model) => Html =
(params, model) => <>
  <i className="material-icons">hourglass_empty</i>
  <DataLoader />
</>

const indexView: (params: IndexParams, model: Model) => Html =
(params, model) => <>
  {topBar("liftracker")}
  <div className="content">
    <div className="card-list">
      {model.lifts.map( lift =>
        <LiftLinkCard key={lift.id} lift={lift} cycle={getById(model.cycles, lift.id) || DefaultCycle}/>
      )}

      <button className={`inline-action ${cycleFinished(model.cycles) ? "primary" : "secondary"}`}
            onClick={() => dispatch(navigate(finishCycleScene()))}>
        START NEW CYCLE
      </button>
    </div>
  </div>
  <button className="primary-action center"
          onClick={() => dispatch(navigate(createScene()))}>
    <i className="material-icons">add</i>
  </button>
</>


const createView: (params: CreateParams, model: Model) => Html =
(params, model) => {
  const save: (name: string, max: number, increment: CycleIncrement, round: WeightRound) => void =
  (name, max, increment, round) => {
    dispatch(newLift(name, max, increment, round)).then(() =>
      dispatch(navigate(indexScene())))
  }

  return <>
    {topBar("Create Lift", true, true)}
    <div className="content">
      <CreateLiftForm onSave={save} />
    </div>
  </>
}


const editView: (params: EditParams, model: Model) => Html =
({ lift }, model) => {
  const save: (name: string, max: number, increment: CycleIncrement, round: WeightRound) => void =
  (name, max, increment, round) => {
    dispatch(editLift(lift, name, max, increment, round)).then(() =>
      dispatch(navigate(indexScene())))
  }

  return <>
    {topBar("Edit Lift", true, true)}
    <div className="content">
      <CreateLiftForm lift={lift} onSave={save} />
    </div>
  </>
}

const workoutView: (params: WorkoutParams, model: Model) => Html =
({ lift, workout }, model) => <>
  {topBar(`${lift.name}`, true)}
  <div className="content">
    <div className="card-list">
      {generateWorkout(lift, workout)}
    </div>
  </div>
</>


const logView: (params: LogParams, model: Model) => Html =
({ lift, workout, movement }, model) => <>
  {topBar(`Log Workout`, true, true)}
  <LogWorkoutForm lift={lift} workout={workout} movement={movement} />
</>


const finishCycleView: (params: FinishCycleParams, model: Model) => Html =
(params, model) => <>
  {topBar(`Start New Cycle`, true, true)}
  <FinishCycleForm lifts={model.lifts} />
</>


const settingsView: (params: SettingsParams, model: Model) => Html =
(params, model) => <>
  {topBar(`Settings`, true, true)}
  <form>
    <div className="form-card">
      {model.lifts.map( lift =>
        <div className="form-row" key={lift.id}>
          <span className="grow">{lift.name}</span>
          <span className="fixed">{lift.max}</span>
          <button className="fixed icon-button" type="button"
                  onClick={() => dispatch(navigate(editScene(lift)))}>
            <i className="material-icons">edit</i>
          </button>
        </div>
      )}
    </div>
  </form>
</>



// -- View Helpers


const topBar: (title: string, back?: boolean, isContextForm?: boolean) => Html =
(title, back, isContextForm = false) =>
  <div className={isContextForm ? "top-bar context-form" : "top-bar"}>
    {back &&
      <button className="navigation" onClick={() => dispatch(navigateBack())}>
        <i className="material-icons">arrow_back</i>
      </button>
    }
    <div className="title">{title}</div>
    <button className="navigation right">
      <i className="material-icons">show_chart</i>
    </button>
    <button className="navigation right" onClick={() => dispatch(navigate(settingsScene()))}>
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


const directWorkoutButton: (lift: Lift, cycle: Cycle, workout: Workout) => Html =
(lift, cycle, workout) =>
  !!cycle[workout]
    ? <button className="direct-set-link" disabled>
        <span>{workout}</span>
        <i className="material-icons">done</i>
      </button>
    : <button className="direct-set-link"
              onClick={() => dispatch(navigate(workoutScene(lift, workout)))}>
        <span>{workout}</span>
      </button>



// -- Components


const DataLoader: (props: {}) => Html =
(props) => {
  useEffect(() => {
    dispatch(loadData()).then(() =>
      dispatch(navigate(indexScene())))
  }, [])

  return <></>
}


const LiftLinkCard: (props: { lift: Lift, cycle: Cycle }) => Html =
({ lift, cycle }) =>
  <div className="card">
    <div className="row">
      <div className="left">
        <div className="title">{lift.name}</div>
        <div className="secondary-actions">
          {directWorkoutButton(lift, cycle, Workout.five)}
          {directWorkoutButton(lift, cycle, Workout.three)}
          {directWorkoutButton(lift, cycle, Workout.one)}
        </div>
      </div>
      <div className="right">
        <button className="next-set-link" disabled={allComplete(cycle)}
                onClick={() => dispatch(navigate(workoutScene(lift, nextUncompleted(cycle))))}>
          <i className="material-icons">arrow_forward_ios</i>
        </button>
      </div>
    </div>
  </div>


type CreateLiftFormProps =
  { lift?: Lift
  , onSave: (name: string, max: number, increment: CycleIncrement, round: WeightRound) => void
  }

const CreateLiftForm: (props: CreateLiftFormProps) => Html =
({ lift, onSave }) => {
  const [name, setName] = useState<string>(lift ? lift.name : "")
  const [max, setMax] = useState<string>(lift ? `${lift.max}` : "")
  const [increment, setIncrement] = useState<string>(lift ? `${lift.increment}` : "5")
  const [round, setRound] = useState<string>(lift ? `${lift.round}` : "5")

  const save = e => {
    e.preventDefault()

    onSave( name
          , parseInt(max, 10)
          , parseInt(increment, 10) as CycleIncrement
          , parseInt(round, 10) as WeightRound
          )
  }

  return <form onSubmit={e => save(e)}>
    <div className="form-card">
      <div className="form-input">
        <label htmlFor="lift-name">Lift name</label>
        <input id="lift-name" type="text" placeholder="lift name"
              value={name}
              onChange={e => setName(e.target.value)} />
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

    dispatch(logWorkout(lift, workout, weight, reps, oneRepEstimate(weight, reps))).then(() =>
      dispatch(navigate(indexScene())))
  }

  return <form onSubmit={e => save(e)}>
    <div className="form-card">
      <div className="form-title">
        {lift.name} - {workout}
      </div>

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

      <div className="form-info">
        Estimated one rep max: <strong>{oneRepEstimate(weight, reps)}</strong>
      </div>

      <button className="primary-action right" type="submit">
        <i className="material-icons">check</i>
      </button>
    </div>
  </form>
}


const FinishCycleForm: (props: {lifts: Lift[]}) => Html =
({ lifts }) => {
  const [increaseMaxes, setIncreaseMaxes] = useState<boolean>(true)
  const submit = e => {
    e.preventDefault()

    dispatch(startNewCycle(increaseMaxes)).then(() =>
      dispatch(navigate(indexScene())))
  }

  return <form onSubmit={e => submit(e)}>
    <div className="form-card">
      <div className="form-row">
        <label htmlFor="increase-maxes">Increases Maxes?</label>
        <button id="increase-maxes" type="button"
                className={`toggle-button ${increaseMaxes ? "on" : "off"}`}
                onClick={() => setIncreaseMaxes(!increaseMaxes)} />
      </div>
    </div>
    <div className="form-card">
      {lifts.map( lift =>
        <div className="form-row" key={lift.id}>
          <span className="grow">{lift.name}</span>
          <span className="fixed">{lift.max}</span>
          <i className="material-icons fixed">arrow_right_alt</i>
          <span className="fixed highlight">{increaseMaxes ? lift.max + lift.increment : lift.max}</span>
        </div>
      )}
    </div>

    <button className="primary-action right" type="submit">
      <i className="material-icons">check</i>
    </button>
  </form>
}



// -- Utilities

const allComplete: (cycle: Cycle) => boolean =
(cycle) =>
  !!(cycle[Workout.five]
  && cycle[Workout.three]
  && cycle[Workout.one])

const cycleFinished: (cycles: Cycle[]) => boolean =
(cycles) =>
  cycles.reduce((result, cycle) =>
    !!(result && cycle[Workout.five]
              && cycle[Workout.three]
              && cycle[Workout.one])
    , true)

const nextUncompleted: (cycle: Cycle) => Workout =
(cycle) => !cycle[Workout.five] ? Workout.five
         : !cycle[Workout.three] ? Workout.three
         : Workout.one

const getById: <T extends{ id: string }>(collection: T[], id: string) => T | undefined =
(collection, id) =>
  collection.find( item => item.id === id)

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
}


main()
