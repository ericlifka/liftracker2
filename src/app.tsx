import React, { useState } from "react"
import ReactDOM from "react-dom"
import { createStore, applyMiddleware } from "redux"
import thunkMiddleware from 'redux-thunk'
import { createLogger as createLoggerMiddleware } from 'redux-logger'
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
  }

const init: () => Model =
() => (
  { activeScene: indexScene()
  })



// -- Update

enum Action
  { navigate = 'navigate'
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


type Msg
  = NavigateAction

const update: (model: Model, msg: Msg) => Model =
(model, msg) => {
  switch (msg.type) {
    case Action.navigate: return(
      { ...model
      , activeScene: { ...msg.scene }
      })

    default: return model
  }
}



// -- Store

const middleware = applyMiddleware(thunkMiddleware, createLoggerMiddleware())
const store = createStore(update, init(), middleware)
const { dispatch, getState, subscribe } = store



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
    <div className="top-affordance"></div>
    <div className="top-bar">
      <div className="title">
        Liftrackr
      </div>
    </div>
    <div className="content">

    </div>
    <button className="primary-action"
            onClick={() => dispatch(navigate(createScene()))}>
      <i className="material-icons md-48">add</i>
    </button>
  </div>

const createScreen: (params: CreateParams, model: Model) => Html =
(params, model) =>
  <div className="app-layout">
    <div className="top-affordance"></div>
    <div className="top-bar">
      <button className="navigation"
              onClick={() => dispatch(navigate(indexScene()))}>
        <i className="material-icons">arrow_back</i>
      </button>
      <div className="title">
        New Lift
      </div>
    </div>
    <div className="content">

    </div>
    {/* <button className="primary-action" onClick={() => dispatch(navigate(createScene()))}>
      <i className="material-icons md-48">add</i>
    </button> */}
  </div>


// -- Main

const main: () => void =
() =>
  ReactDOM.render(
    <View />,
    document.getElementById("root"))


main()
