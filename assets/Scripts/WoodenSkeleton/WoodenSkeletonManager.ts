import { _decorator } from "cc";
import { CONTROLLER_ENUM, DIRECTION_ENUM, DIRECTION_ORDER_ENUM, ENTITY_STATE_ENUM, ENTITY_TYPE_ENUM, EVENT_ENUM } from "../../Enums";
import { EntityManager } from "../../Base/EntityManager";
import { WoodenSkeletonStateMachine } from "./WoodenSkeletonStateManager";
import EventManager from "../../Runtime/EventManager";
import DataManager from "../../Runtime/DataManager";
const { ccclass, property } = _decorator;

@ccclass('WoodenSkeletonManager')
export class WoodenSkeletonManager extends EntityManager {
  async init() {
    this.fsm = this.addComponent(WoodenSkeletonStateMachine);
    await this.fsm.init();   // 有异步操作，使用Promise list等待所有资源加载后才退出

    super.init({
      x: 2,
      y: 4,
      type: ENTITY_TYPE_ENUM.ENEMY,
      direction: DIRECTION_ENUM.TOP,
      state: ENTITY_STATE_ENUM.IDLE
    })

    EventManager.Instance.on(EVENT_ENUM.PLAYER_MOVE_END, this.onChangeDirection, this);
    EventManager.Instance.on(EVENT_ENUM.PLAYER_MOVE_END, this.onAttack, this);
    // 初次加载时，玩家可能比敌人后加载完成，需要刷新一次方向
    EventManager.Instance.on(EVENT_ENUM.PLAYER_BORN, this.onChangeDirection, this);
    this.onChangeDirection(true);
  }

  /**
   * 敌人随着玩家移动改变方向
   * @param isInit 在游戏初次加载生成玩家后，传递true强制改变敌人方向
   * @returns
   */
  onChangeDirection(isInit: boolean = false) {
    if (!DataManager.Instance.player) {
      return;
    }
    const {x: playerX, y: playerY} = DataManager.Instance.player;

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

  onAttack() {
    const {x: playerX, y: playerY} = DataManager.Instance.player;

    if (
      (this.x === playerX && Math.abs(this.y - playerY) <= 1) ||
      (this.y === playerY && Math.abs(this.x - playerX) <= 1)
    ) {
      this.state = ENTITY_STATE_ENUM.ATTACK;
    } else {
      this.state = ENTITY_STATE_ENUM.IDLE;
    }
  }
}
