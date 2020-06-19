import React, { useState } from "react"
import ReactDOM from "react-dom"
import { createStore, applyMiddleware } from "redux"
import thunkMiddleware from 'redux-thunk'
import { createLogger as createLoggerMiddleware } from 'redux-logger'
import { Promise } from 'es6-promise'
import { Lift, createLift, queryLifts, SetIncrement, WeightRound } from './modules/database'
import './styles/app.less'



// -- Models

enum Scene
  { index = 'index'
  , create = 'create'
  }

type IndexParams = null
type CreateParams = null

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

type ActiveScene
  = IndexScene
  | CreateScene


type Model =
  { activeScene: ActiveScene
  , lifts: Lift[]
  }

const init: () => Model =
() => (
  { activeScene: indexScene()
  , lifts: []
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
  }
const setData: (lifts: Lift[]) => SetDataAction =
(lifts) => (
  { type: Action.setData
  , lifts
  })

type AddLiftAction =
  { type: Action.addLift
  , lift: Lift
  }
const addLift: (lift: Lift) => AddLiftAction =
(lift) => (
  { type: Action.addLift
  , lift
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
      })

    case Action.addLift: return (
      { ...model
      , lifts: [ ...model.lifts, msg.lift ]
      })

    default: return model
  }
}



// -- Async

const loadData: () => (dispatch: Function) => Promise<Lift[]> =
() => dispatch =>
  queryLifts().then( lifts => {
    dispatch(setData(lifts))
    return lifts
  })

const newLift: (name: string, max: number, increment: SetIncrement, round: WeightRound) => (dispatch: Function) => Promise<Lift> =
(name, max, increment, round) => dispatch =>
  createLift(name, max, increment, round).then( lift => {
    dispatch(addLift(lift))
    return lift
  })



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
  const { scene, params } = model.activeScene
  switch (scene) {
    case Scene.index: return indexScreen(params, model)
    case Scene.create: return createScreen(params, model)
  }
}


const indexScreen: (params: IndexParams, model: Model) => Html =
(params, model) =>
  <div className="app-layout">
    {topBar("liftracker")}
    <div className="content">
      {
        model.lifts.map( lift => <div>{lift.name}</div>)
      }
    </div>
    <button className="primary-action center"
            onClick={() => dispatch(navigate(createScene()))}>
      <i className="material-icons md-48">add</i>
    </button>
  </div>


const createScreen: (params: CreateParams, model: Model) => Html =
(params, model) =>
  <div className="app-layout">
    {topBar("Create Lift", true, navigate(indexScene()))}
    <div className="content">
      <CreateLiftForm />
    </div>
  </div>


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
      parseInt(increment, 10) as SetIncrement,
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
      <i className="material-icons md-48">check</i>
    </button>
  </form>
}


// -- Main

const main: () => void =
() => {
  ReactDOM.render(
    <View />,
    document.getElementById("root"))

  dispatch(loadData())
}


main()
