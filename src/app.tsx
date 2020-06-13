import React, { useState } from "react"
import ReactDOM from "react-dom"
import { createStore, applyMiddleware } from "redux"
import thunkMiddleware from 'redux-thunk'
import { createLogger as createLoggerMiddleware } from 'redux-logger'
import './styles/app.less'



// -- Models

enum Screen
  { index
  , create
  }

type IndexParams = void
type CreateParams = void

type NavigationParams
  = IndexParams
  | CreateParams


type Model =
  { activeScreen: Screen
  }

const init: () => Model =
() => (
  { activeScreen: Screen.index
  })



// -- Update

enum Action
  { navigate
  }


type NavigateAction =
  { type: Action.navigate
  , screen: Screen
  , params: NavigationParams
  }

const navigate: (screen: Screen, params: NavigationParams) => NavigateAction =
(screen, params) => (
  { type: Action.navigate
  , screen
  , params
  })


type Msg
  = NavigateAction

const update: (model: Model, msg: Msg) => Model =
(model, msg) => {
  switch (msg.type) {
    case Action.navigate: return(
      { ...model
      , activeScreen: msg.screen
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
  switch (model.activeScreen) {
    case Screen.index: return indexScreen(model)
    case Screen.create: return createScreen(model)
  }
}

const indexScreen: (model: Model) => Html =
(model) =>
  <div className="app-layout">
    <div className="top-affordance"></div>
    <div className="top-bar">
      <button className="navigation">
        <i className="material-icons">arrow_back</i>
      </button>
      <div className="title">
        Liftrackr
      </div>
    </div>
    <div className="content">

    </div>
    <button className="primary-action" onClick={() => dispatch(navigate(Screen.create))}>
      <i className="material-icons md-48">add</i>
    </button>
  </div>

const createScreen: (model: Model) => Html =
(model) =>
  <div>void</div>


// -- Main

const main: () => void =
() =>
  ReactDOM.render(
    <View />,
    document.getElementById("root"))


main()
