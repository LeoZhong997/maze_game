import { _decorator, Component } from 'cc';
import EventManager from '../../Runtime/EventManager';
import { EVENT_ENUM } from '../../Enums';
const { ccclass, property } = _decorator;

@ccclass('MenuManager')
export class MenuManager extends Component {
  handleUndo() {
    EventManager.Instance.emit(EVENT_ENUM.REVOKE_STEP);
  }
}
