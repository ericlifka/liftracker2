import React, { useState } from "react"
import ReactDOM from "react-dom"
import { createStore, applyMiddleware } from "redux"
import thunkMiddleware from 'redux-thunk'
import { createLogger as createLoggerMiddleware } from 'redux-logger'


// -- Model

type Model =
  { counter: number
  }

const init: () => Model =
() => (
  { counter: 0
  })


// -- Update

enum Actions
  { increment
  , decrement
  , reset
  }

type IncrementAction =
  { type: Actions.increment
  , quantity: number
  }

const increment: (quantity: number) => IncrementAction =
(quantity) => (
  { type: Actions.increment
  , quantity
  })

type DecrementAction =
  { type: Actions.decrement
  , quantity: number
  }

const decrement: (quantity: number) => DecrementAction =
(quantity) => (
  { type: Actions.decrement
  , quantity
  })

type ResetAction =
  { type: Actions.reset
  }

const reset: () => ResetAction =
() => (
  { type: Actions.reset
  })

type Msg
  = IncrementAction
  | DecrementAction
  | ResetAction

const update: (model: Model, msg: Msg) => Model =
(model, msg) => {
  switch (msg.type) {
    case Actions.increment: return (
      { ...model
      , counter: model.counter + msg.quantity
      })

    case Actions.decrement: return (
      { ...model
      , counter: model.counter - msg.quantity
      })

    case Actions.reset: return (
      { ... model
      , counter: 0
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

type AppProps =
  { model: Model
  }

const App: (props: AppProps) => Html =
({ model }) =>
  <div>
    <div style={{ display: "flex" }}>
      {button("-1", decrement(1))}
      <div>{model.counter}</div>
      {button("+1", increment(1))}
    </div>
    <div style={{ display: "flex" }}>
      {button("clear", reset())}
    </div>
  </div>

const button: (text: string, msg: Msg) => Html =
(text, msg) =>
  <button onClick={() => dispatch(msg)}>{text}</button>

// -- Main

const main: () => void =
() =>
  ReactDOM.render(
    <View />,
    document.getElementById("root"))


main()
