import React, { useState } from "react"
import ReactDOM from "react-dom"
import { createStore, applyMiddleware } from "redux"
import thunkMiddleware from 'redux-thunk'
import { createLogger as createLoggerMiddleware } from 'redux-logger'
import './styles/app.less'


// -- Model

type Model =
  {
  }

const init: () => Model =
() => (
  {
  })


// -- Update

enum Actions
  {
  }

type Msg
  = { type: Actions }

const update: (m: Model, ms: Msg) => Model =
(model, msg) => {
  switch (msg.type) {
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
({ model }) =>
  <div className="app-layout">
    <div className="top-affordance"></div>
    <div className="top-bar">
      Liftrackr
    </div>
    <div className="content">

    </div>
    <button className="primary-action">+</button>
  </div>


// -- Main

const main: () => void =
() =>
  ReactDOM.render(
    <View />,
    document.getElementById("root"))


main()
