import { PARAMS_NAME_ENUM, SPIKES_COUNT_MAP_NUMBER_ENUM } from '../../Enums';
import { SubStateMachine } from '../../Base/SubStateMachine';

export default class SpikeSubStateMachine extends SubStateMachine {
  run() {
    const value = this.fsm.getParams(PARAMS_NAME_ENUM.SPIKES_CUR_COUNT).value;
    this.currentState = this.stateMachines.get(SPIKES_COUNT_MAP_NUMBER_ENUM[value as number]);
  }
}
