import { _decorator } from 'cc';
import {
  CONTROLLER_ENUM,
  DIRECTION_ENUM,
  DIRECTION_ORDER_ENUM,
  ENTITY_STATE_ENUM,
  ENTITY_TYPE_ENUM,
  EVENT_ENUM,
} from '../../Enums';
import { EntityManager } from '../../Base/EntityManager';
import EventManager from '../../Runtime/EventManager';
import DataManager from '../../Runtime/DataManager';
import { DoorStateMachine } from './DoorStateMachine';
const { ccclass, property } = _decorator;

@ccclass('DoorManager')
export class DoorManager extends EntityManager {
  async init() {
    this.fsm = this.addComponent(DoorStateMachine);
    await this.fsm.init(); // 有异步操作，使用Promise list等待所有资源加载后才退出

    super.init({
      x: 7,
      y: 8,
      type: ENTITY_TYPE_ENUM.DOOR,
      direction: DIRECTION_ENUM.TOP,
      state: ENTITY_STATE_ENUM.IDLE,
    });

    EventManager.Instance.on(EVENT_ENUM.DOOR_OPEN, this.onOpen, this);
  }

  onOpen() {
    if (
      DataManager.Instance.enemies.every(enemy => enemy.state === ENTITY_STATE_ENUM.DEATH) &&
      this.state !== ENTITY_STATE_ENUM.DEATH
    ) {
      this.state = ENTITY_STATE_ENUM.DEATH;
    }
  }

  onDestroy() {
    super.onDestroy();
    EventManager.Instance.off(EVENT_ENUM.DOOR_OPEN, this.onOpen);
  }
}
