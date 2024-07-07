import { _decorator, Animation } from 'cc';
import { ENTITY_TYPE_ENUM, PARAMS_NAME_ENUM, SPIKES_TYPE_MAP_TOTAL_COUNT_ENUM } from '../../Enums';
import { StateMachine, getInitParamsNumber } from '../../Base/StateMachine';
import SpikesOneSubStateMachine from './SpikesOneSubStateMachine';
const { ccclass, property } = _decorator;

@ccclass('SpikesStateMachine')
export class SpikesStateMachine extends StateMachine {
  async init() {
    this.animationComponent = this.addComponent(Animation);

    this.initParams();
    this.initStateMachine(); // 初始化状态机，加载动画
    this.initAnimationEvent();

    await Promise.all(this.waitingList); // 等待所有资源都加载完成
  }

  initParams() {
    this.params.set(PARAMS_NAME_ENUM.SPIKES_CUR_COUNT, getInitParamsNumber());
    this.params.set(PARAMS_NAME_ENUM.SPIKES_TOTAL_COUNT, getInitParamsNumber());
  }

  initStateMachine() {
    // State的构造函数中有异步加载动画资源
    this.stateMachines.set(ENTITY_TYPE_ENUM.SPIKES_ONE, new SpikesOneSubStateMachine(this));
  }

  initAnimationEvent() {}

  run() {
    const totalCount = this.getParams(PARAMS_NAME_ENUM.SPIKES_TOTAL_COUNT).value;
    switch (this.currentState) {
      case this.stateMachines.get(ENTITY_TYPE_ENUM.SPIKES_ONE):
        // 根据Spikes的总点数切换当前状态，在状态机内部再根据当前点数切换子状态
        if (totalCount === SPIKES_TYPE_MAP_TOTAL_COUNT_ENUM.SPIKES_ONE) {
          this.currentState = this.stateMachines.get(ENTITY_TYPE_ENUM.SPIKES_ONE);
        } else {
          this.currentState = this.currentState;
        }
        break;
      default:
        this.currentState = this.stateMachines.get(ENTITY_TYPE_ENUM.SPIKES_ONE);
    }
  }
}
