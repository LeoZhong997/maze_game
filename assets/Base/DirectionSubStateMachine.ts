import { DIRECTION_ORDER_ENUM, PARAMS_TYPE_ENUM } from "../Enums";
import { SubStateMachine } from "./SubStateMachine";



const BASE_URL = 'texture/player/idle'

export default class DirectionSubStateMachine extends SubStateMachine {
  run() {
    const value = this.fsm.getParams(PARAMS_TYPE_ENUM.DIRECTION).value  // number | bool
    this.currentState = this.stateMachines.get(DIRECTION_ORDER_ENUM[value as number]);
  }
}
