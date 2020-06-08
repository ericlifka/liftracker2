import React, { useState, FunctionComponent } from "react"
import ReactDOM from "react-dom"
import { createStore } from "redux"


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

type Msg
  = IncrementAction
  | DecrementAction

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

    default: return model
  }
}

const { dispatch, getState, subscribe } = createStore(update, init())


// -- View

const View: FunctionComponent =
() => {
  const [model, setModel] = useState<Model>(getState())
  subscribe(() => setModel(getState()))

  return <App model={model} />
}

type AppProps =
  { model: Model
  }

const App: FunctionComponent<AppProps> =
({ model }) =>
  <div>
    <button onClick={() => dispatch(decrement(1))}>-1</button>
    <div>{model.counter}</div>
    <button onClick={() => dispatch(increment(1))}>+1</button>
  </div>


// -- Main

const main: () => void =
() =>
  ReactDOM.render(
    <View />,
    document.getElementById("root"))


main()
