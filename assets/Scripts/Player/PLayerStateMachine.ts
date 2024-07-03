import { _decorator, Animation } from "cc";
import { ENTITY_STATE_ENUM, FSM_PARAM_TYPE_ENUM, PARAMS_NAME_ENUM } from "../../Enums";
import { StateMachine, getInitParamsNumber, getInitParamsTrigger } from "../../Base/StateMachine";
import IdleSubStateMachine from "./IdleSubStateMachine";
import TurnLeftSubStateMachine from "./TurnLeftSubStateMachine";
import BlockFrontSubStateMachine from "./BlockFrontSubStateMachine";
import { EntityManager } from "../../Base/EntityManager";
import BlockTurnLeftSubStateMachine from "./BlockTurnLeftSubStateMachine";
import BlockBackSubStateMachine from "./BlockBackSubStateMachine";
import BlockLeftSubStateMachine from "./BlockLeftSubStateMachine";
import BlockRightSubStateMachine from "./BlockRightSubStateMachine";
import BlockTurnRightSubStateMachine from "./BlockTurnRightSubStateMachine";
import TurnRightSubStateMachine from "./TurnRightSubStateMachine";
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
    this.params.set(PARAMS_NAME_ENUM.IDLE, getInitParamsTrigger());
    this.params.set(PARAMS_NAME_ENUM.TURNLEFT, getInitParamsTrigger());
    this.params.set(PARAMS_NAME_ENUM.TURNRIGHT, getInitParamsTrigger());
    this.params.set(PARAMS_NAME_ENUM.BLOCKFRONT, getInitParamsTrigger());
    this.params.set(PARAMS_NAME_ENUM.BLOCKBACK, getInitParamsTrigger());
    this.params.set(PARAMS_NAME_ENUM.BLOCKLEFT, getInitParamsTrigger());
    this.params.set(PARAMS_NAME_ENUM.BLOCKRIGHT, getInitParamsTrigger());
    this.params.set(PARAMS_NAME_ENUM.BLOCKTURNLEFT, getInitParamsTrigger());
    this.params.set(PARAMS_NAME_ENUM.BLOCKTURNRIGHT, getInitParamsTrigger());
    this.params.set(PARAMS_NAME_ENUM.DIRECTION, getInitParamsNumber());
  }

  initStateMachine() {
    // State的构造函数中有异步加载动画资源
    this.stateMachines.set(PARAMS_NAME_ENUM.IDLE, new IdleSubStateMachine(this));
    this.stateMachines.set(PARAMS_NAME_ENUM.TURNLEFT, new TurnLeftSubStateMachine(this));
    this.stateMachines.set(PARAMS_NAME_ENUM.TURNRIGHT, new TurnRightSubStateMachine(this));
    this.stateMachines.set(PARAMS_NAME_ENUM.BLOCKFRONT, new BlockFrontSubStateMachine(this));
    this.stateMachines.set(PARAMS_NAME_ENUM.BLOCKBACK, new BlockBackSubStateMachine(this));
    this.stateMachines.set(PARAMS_NAME_ENUM.BLOCKLEFT, new BlockLeftSubStateMachine(this));
    this.stateMachines.set(PARAMS_NAME_ENUM.BLOCKRIGHT, new BlockRightSubStateMachine(this));
    this.stateMachines.set(PARAMS_NAME_ENUM.BLOCKTURNLEFT, new BlockTurnLeftSubStateMachine(this));
    this.stateMachines.set(PARAMS_NAME_ENUM.BLOCKTURNRIGHT, new BlockTurnRightSubStateMachine(this));
  }

  initAnimationEvent() {
    this.animationComponent.on(Animation.EventType.FINISHED, () => {
      const name = this.animationComponent.defaultClip.name;
      const whiteList = ['turn', 'block'];
      if (whiteList.some(v => name.includes(v))) {
        this.node.getComponent(EntityManager).state = ENTITY_STATE_ENUM.IDLE;
      }
    })
  }

  run() {
    switch(this.currentState) {
      case this.stateMachines.get(PARAMS_NAME_ENUM.IDLE):
      case this.stateMachines.get(PARAMS_NAME_ENUM.TURNLEFT):
      case this.stateMachines.get(PARAMS_NAME_ENUM.TURNRIGHT):
      case this.stateMachines.get(PARAMS_NAME_ENUM.BLOCKFRONT):
      case this.stateMachines.get(PARAMS_NAME_ENUM.BLOCKBACK):
      case this.stateMachines.get(PARAMS_NAME_ENUM.BLOCKLEFT):
      case this.stateMachines.get(PARAMS_NAME_ENUM.BLOCKRIGHT):
      case this.stateMachines.get(PARAMS_NAME_ENUM.BLOCKTURNLEFT):
      case this.stateMachines.get(PARAMS_NAME_ENUM.BLOCKTURNRIGHT):
        // 通过Trigger参数检测是否需要切换状态
        if(this.params.get(PARAMS_NAME_ENUM.TURNLEFT).value) {
          this.currentState = this.stateMachines.get(PARAMS_NAME_ENUM.TURNLEFT)
        } else if(this.params.get(PARAMS_NAME_ENUM.TURNRIGHT).value) {
          this.currentState = this.stateMachines.get(PARAMS_NAME_ENUM.TURNRIGHT)
        } else if(this.params.get(PARAMS_NAME_ENUM.BLOCKFRONT).value) {
          this.currentState = this.stateMachines.get(PARAMS_NAME_ENUM.BLOCKFRONT)
        } else if(this.params.get(PARAMS_NAME_ENUM.BLOCKBACK).value) {
          this.currentState = this.stateMachines.get(PARAMS_NAME_ENUM.BLOCKBACK)
        } else if(this.params.get(PARAMS_NAME_ENUM.BLOCKLEFT).value) {
          this.currentState = this.stateMachines.get(PARAMS_NAME_ENUM.BLOCKLEFT)
        } else if(this.params.get(PARAMS_NAME_ENUM.BLOCKRIGHT).value) {
          this.currentState = this.stateMachines.get(PARAMS_NAME_ENUM.BLOCKRIGHT)
        } else if(this.params.get(PARAMS_NAME_ENUM.BLOCKTURNLEFT).value) {
          this.currentState = this.stateMachines.get(PARAMS_NAME_ENUM.BLOCKTURNLEFT)
        } else if(this.params.get(PARAMS_NAME_ENUM.BLOCKTURNRIGHT).value) {
          this.currentState = this.stateMachines.get(PARAMS_NAME_ENUM.BLOCKTURNRIGHT)
        } else if(this.params.get(PARAMS_NAME_ENUM.IDLE).value) {
          this.currentState = this.stateMachines.get(PARAMS_NAME_ENUM.IDLE)
        } else {
          this.currentState = this.currentState   // 方向改变时不需要切换状态
        }
        break;
      default:
        this.currentState = this.stateMachines.get(PARAMS_NAME_ENUM.IDLE)
    }
  }
}
