import { _decorator, Animation } from 'cc';
import { PARAMS_NAME_ENUM } from '../../Enums';
import { StateMachine, getInitParamsTrigger } from '../../Base/StateMachine';

import State from '../../Base/State';
const { ccclass, property } = _decorator;

const BASE_URL = 'texture/burst';

@ccclass('BurstStateMachine')
export class BurstStateMachine extends StateMachine {
  async init() {
    this.animationComponent = this.addComponent(Animation);

    this.initParams();
    this.initStateMachine(); // 初始化状态机，加载动画
    this.initAnimationEvent();

    await Promise.all(this.waitingList); // 等待所有资源都加载完成
  }

  initParams() {
    this.params.set(PARAMS_NAME_ENUM.IDLE, getInitParamsTrigger());
    this.params.set(PARAMS_NAME_ENUM.ATTACK, getInitParamsTrigger());
    this.params.set(PARAMS_NAME_ENUM.DEATH, getInitParamsTrigger());
  }

  initStateMachine() {
    // State的构造函数中有异步加载动画资源
    this.stateMachines.set(PARAMS_NAME_ENUM.IDLE, new State(this, `${BASE_URL}/idle`));
    this.stateMachines.set(PARAMS_NAME_ENUM.ATTACK, new State(this, `${BASE_URL}/attack`));
    this.stateMachines.set(PARAMS_NAME_ENUM.DEATH, new State(this, `${BASE_URL}/death`));
  }

  initAnimationEvent() {}

  run() {
    switch (this.currentState) {
      case this.stateMachines.get(PARAMS_NAME_ENUM.IDLE):
      case this.stateMachines.get(PARAMS_NAME_ENUM.ATTACK):
      case this.stateMachines.get(PARAMS_NAME_ENUM.DEATH):
        // 通过Trigger参数检测是否需要切换状态
        if (this.params.get(PARAMS_NAME_ENUM.IDLE).value) {
          this.currentState = this.stateMachines.get(PARAMS_NAME_ENUM.IDLE);
        } else if (this.params.get(PARAMS_NAME_ENUM.ATTACK).value) {
          this.currentState = this.stateMachines.get(PARAMS_NAME_ENUM.ATTACK);
        } else if (this.params.get(PARAMS_NAME_ENUM.DEATH).value) {
          this.currentState = this.stateMachines.get(PARAMS_NAME_ENUM.DEATH);
        } else {
          this.currentState = this.currentState; // 方向改变时不需要切换状态
        }
        break;
      default:
        this.currentState = this.stateMachines.get(PARAMS_NAME_ENUM.IDLE);
    }
  }
}
