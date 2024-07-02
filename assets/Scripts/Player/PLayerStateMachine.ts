import { _decorator, Animation } from "cc";
import { FSM_PARAM_TYPE_ENUM, PARAMS_TYPE_ENUM } from "../../Enums";
import { StateMachine, getInitParamsNumber, getInitParamsTrigger } from "../../Base/StateMachine";
import IdleSubStateMachine from "./IdleSubStateMachine";
import TurnLeftSubStateMachine from "./TurnLeftSubStateMachine";
const { ccclass, property } = _decorator;

type ParamsValueType = boolean | number;

export interface IParamsValue {
  type: FSM_PARAM_TYPE_ENUM;
  value: ParamsValueType;
}

@ccclass('PlayerStateMachine')
export class PlayerStateMachine extends StateMachine {
  async init() {
    this.animationComponent = this.addComponent(Animation);

    this.initParams();
    this.initStateMachine();  // 初始化状态机，加载动画
    this.initAnimationEvent();

    await Promise.all(this.waitingList);   // 等待所有资源都加载完成
  }

  initParams() {
    this.params.set(PARAMS_TYPE_ENUM.IDLE, getInitParamsTrigger());
    this.params.set(PARAMS_TYPE_ENUM.TURNLEFT, getInitParamsTrigger());
    this.params.set(PARAMS_TYPE_ENUM.DIRECTION, getInitParamsNumber());
  }

  initStateMachine() {
    // State的构造函数中有异步加载动画资源
    this.stateMachines.set(PARAMS_TYPE_ENUM.IDLE, new IdleSubStateMachine(this));
    this.stateMachines.set(PARAMS_TYPE_ENUM.TURNLEFT, new TurnLeftSubStateMachine(this));
  }

  initAnimationEvent() {
    this.animationComponent.on(Animation.EventType.FINISHED, () => {
      const name = this.animationComponent.defaultClip.name;
      const whiteList = ['turn'];
      if (whiteList.some(v => name.includes(v))) {
        this.setParams(PARAMS_TYPE_ENUM.IDLE, true)
      }
    })
  }

  run() {
    switch(this.currentState) {
      case this.stateMachines.get(PARAMS_TYPE_ENUM.TURNLEFT):
      case this.stateMachines.get(PARAMS_TYPE_ENUM.IDLE):
        // 通过Trigger参数检测是否需要切换状态
        if(this.params.get(PARAMS_TYPE_ENUM.TURNLEFT).value) {
          this.currentState = this.stateMachines.get(PARAMS_TYPE_ENUM.TURNLEFT)
        } else if(this.params.get(PARAMS_TYPE_ENUM.IDLE).value) {
          this.currentState = this.stateMachines.get(PARAMS_TYPE_ENUM.IDLE)
        } else {
          this.currentState = this.currentState   // 方向改变时不需要切换状态
        }
        break;
      default:
        this.currentState = this.stateMachines.get(PARAMS_TYPE_ENUM.IDLE)
    }
  }
}
