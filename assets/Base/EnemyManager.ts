import { _decorator } from 'cc';
import {
  CONTROLLER_ENUM,
  DIRECTION_ENUM,
  DIRECTION_ORDER_ENUM,
  ENTITY_STATE_ENUM,
  ENTITY_TYPE_ENUM,
  EVENT_ENUM,
} from '../Enums';
import { EntityManager } from './EntityManager';
import { IEntity } from '../Levels';
import EventManager from '../Runtime/EventManager';
import DataManager from '../Runtime/DataManager';
import { WoodenSkeletonStateMachine } from '../Scripts/WoodenSkeleton/WoodenSkeletonStateManager';
const { ccclass, property } = _decorator;

@ccclass('EnemyManager')
export class EnemyManager extends EntityManager {
  async init(params: IEntity) {
    super.init(params);

    EventManager.Instance.on(EVENT_ENUM.PLAYER_MOVE_END, this.onChangeDirection, this);
    EventManager.Instance.on(EVENT_ENUM.ATTACK_ENEMY, this.onDead, this);
    // 初次加载时，玩家可能比敌人后加载完成，需要刷新一次方向
    EventManager.Instance.on(EVENT_ENUM.PLAYER_BORN, this.onChangeDirection, this);
    this.onChangeDirection(true);
  }

  onDestroy() {
    super.onDestroy();
    EventManager.Instance.off(EVENT_ENUM.PLAYER_MOVE_END, this.onChangeDirection);
    EventManager.Instance.off(EVENT_ENUM.ATTACK_ENEMY, this.onDead);
    EventManager.Instance.off(EVENT_ENUM.PLAYER_BORN, this.onChangeDirection);
  }

  /**
   * 敌人随着玩家移动改变方向
   * @param isInit 在游戏初次加载生成玩家后，传递true强制改变敌人方向
   * @returns
   */
  onChangeDirection(isInit: boolean = false) {
    if (this.state === ENTITY_STATE_ENUM.DEATH || !DataManager.Instance.player) {
      return;
    }
    const { x: playerX, y: playerY } = DataManager.Instance.player;

    const disX = Math.abs(this.x - playerX);
    const disY = Math.abs(this.y - playerY);

    if (disX === disY && !isInit) {
      return;
    }

    if (playerX >= this.x && playerY < this.y) {
      // 第一象限
      this.direction = disX > disY ? DIRECTION_ENUM.RIGHT : DIRECTION_ENUM.TOP;
    } else if (playerX < this.x && playerY < this.y) {
      // 第二象限
      this.direction = disX > disY ? DIRECTION_ENUM.LEFT : DIRECTION_ENUM.TOP;
    } else if (playerX < this.x && playerY >= this.y) {
      // 第三象限
      this.direction = disX > disY ? DIRECTION_ENUM.LEFT : DIRECTION_ENUM.BOTTOM;
    } else if (playerX >= this.x && playerY >= this.y) {
      // 第四象限
      this.direction = disX > disY ? DIRECTION_ENUM.RIGHT : DIRECTION_ENUM.BOTTOM;
    }
  }

  onDead(id: string) {
    if (this.state === ENTITY_STATE_ENUM.DEATH && this.id !== id) {
      return;
    }

    if (this.id === id) {
      this.state = ENTITY_STATE_ENUM.DEATH;
    }
  }
}
