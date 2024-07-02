import { _decorator} from "cc";
import State from "./State";
import { StateMachine } from "./StateMachine";

export abstract class SubStateMachine {
  private _currentState: State | SubStateMachine = null;
  stateMachines: Map<string, State | SubStateMachine> = new Map();

  constructor(public fsm: StateMachine) {}

  get currentState() {
    return this._currentState;
  }

  set currentState(newState: State | SubStateMachine) {
    this._currentState = newState;
    this._currentState.run();
  }

  abstract run(): void
}
