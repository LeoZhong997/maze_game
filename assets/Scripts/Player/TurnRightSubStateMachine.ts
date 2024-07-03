import DirectionSubStateMachine from "../../Base/DirectionSubStateMachine";
import State from "../../Base/State";
import { StateMachine } from "../../Base/StateMachine";
import { DIRECTION_ENUM, DIRECTION_ORDER_ENUM, PARAMS_NAME_ENUM } from "../../Enums";

const BASE_URL = 'texture/player/turnright'

export default class TurnRightSubStateMachine extends DirectionSubStateMachine {
  constructor(fsm: StateMachine) {
      super(fsm);
      this.stateMachines.set(DIRECTION_ENUM.TOP, new State(fsm, `${BASE_URL}/top`));
      this.stateMachines.set(DIRECTION_ENUM.BOTTOM, new State(fsm, `${BASE_URL}/bottom`));
      this.stateMachines.set(DIRECTION_ENUM.LEFT, new State(fsm, `${BASE_URL}/left`));
      this.stateMachines.set(DIRECTION_ENUM.RIGHT, new State(fsm, `${BASE_URL}/right`));
  }

  run() {
    super.run();
    // const value = this.fsm.getParams(PARAMS_NAME_ENUM.DIRECTION).value
    // console.log('TurnRightSubStateMachine', DIRECTION_ORDER_ENUM[value as number])
  }
}
