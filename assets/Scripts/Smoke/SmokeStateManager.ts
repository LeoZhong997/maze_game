import { _decorator, Animation } from 'cc';
import { ENTITY_STATE_ENUM, PARAMS_NAME_ENUM } from '../../Enums';
import { StateMachine, getInitParamsNumber, getInitParamsTrigger } from '../../Base/StateMachine';
import IdleSubStateMachine from './IdleSubStateMachine';
import DeathSubStateMachine from './DeathSubStateMachine';
import { EntityManager } from '../../Base/EntityManager';
const { ccclass, property } = _decorator;

@ccclass('SmokeStateMachine')
export class SmokeStateMachine extends StateMachine {
  async init() {
    this.animationComponent = this.addComponent(Animation);

    this.initParams();
    this.initStateMachine(); // 初始化状态机，加载动画
    this.initAnimationEvent();

    await Promise.all(this.waitingList); // 等待所有资源都加载完成
  }

  initParams() {
    this.params.set(PARAMS_NAME_ENUM.IDLE, getInitParamsTrigger());
    this.params.set(PARAMS_NAME_ENUM.DEATH, getInitParamsTrigger());
    this.params.set(PARAMS_NAME_ENUM.DIRECTION, getInitParamsNumber());
  }

  initStateMachine() {
    // State的构造函数中有异步加载动画资源
    this.stateMachines.set(PARAMS_NAME_ENUM.IDLE, new IdleSubStateMachine(this));
    this.stateMachines.set(PARAMS_NAME_ENUM.DEATH, new DeathSubStateMachine(this));
  }

  initAnimationEvent() {
    this.animationComponent.on(Animation.EventType.FINISHED, () => {
      const name = this.animationComponent.defaultClip.name;
      const whiteList = ['idle'];
      if (whiteList.some(v => name.includes(v))) {
        this.node.getComponent(EntityManager).state = ENTITY_STATE_ENUM.DEATH;
      }
    });
  }

  run() {
    switch (this.currentState) {
      case this.stateMachines.get(PARAMS_NAME_ENUM.IDLE):
      case this.stateMachines.get(PARAMS_NAME_ENUM.DEATH):
        // 通过Trigger参数检测是否需要切换状态
        if (this.params.get(PARAMS_NAME_ENUM.IDLE).value) {
          this.currentState = this.stateMachines.get(PARAMS_NAME_ENUM.IDLE);
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
