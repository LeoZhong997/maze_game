import { _decorator, Component } from "cc";
import EventManager from "../../Runtime/EventManager";
import { CONTROLLER_ENUM, EVENT_ENUM } from "../../Enums";
const { ccclass, property } = _decorator;

@ccclass('ControllerManager')
export class ControllerManager extends Component {

  handleControl(event:Event, type:string) {
    // 触发事件，类型转换
    EventManager.Instance.emit(EVENT_ENUM.PLAYER_CTRL, type as CONTROLLER_ENUM)
  }
}
