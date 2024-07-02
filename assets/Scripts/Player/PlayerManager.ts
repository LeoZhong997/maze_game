import { _decorator, Component, Sprite, UITransform, Animation, AnimationClip, animation, SpriteFrame } from "cc";
import { TILE_HEIGHT, TILE_WIDTH } from "../Tile/TileManager";
import { CONTROLLER_ENUM, DIRECTION_ENUM, DIRECTION_ORDER_ENUM, ENTITY_STATE_ENUM, ENTITY_TYPE_ENUM, EVENT_ENUM, PARAMS_TYPE_ENUM } from "../../Enums";
import EventManager from "../../Runtime/EventManager";
import { PlayerStateMachine } from "./PLayerStateMachine";
import { EntityManager } from "../../Base/EntityManager";
const { ccclass, property } = _decorator;

@ccclass('PlayerManager')
export class PlayerManager extends EntityManager {
  targetX: number = 0;
  targetY: number = 0;
  private readonly speed = 1 / 10;

  async init() {
    this.fsm = this.addComponent(PlayerStateMachine);
    await this.fsm.init();   // 有异步操作，使用Promise list等待所有资源加载后才退出

    super.init({
      x: 0,
      y: 0,
      type: ENTITY_TYPE_ENUM.PLAYER,
      direction: DIRECTION_ENUM.TOP,
      state: ENTITY_STATE_ENUM.IDLE
    })

    // 注册监听事件
    EventManager.Instance.on(EVENT_ENUM.PLAYER_CTRL, this.move, this);
  }

  update() {
    this.updateXY();
    super.update();
  }

  updateXY() {
    if (this.targetX < this.x) {
      this.x -= this.speed;
    } else if (this.targetX > this.x) {
      this.x += this.speed;
    }

    if (this.targetY < this.y) {
      this.y -= this.speed;
    } else if (this.targetY > this.y) {
      this.y += this.speed;
    }

    if (Math.abs(this.targetX - this.x) <= this.speed && Math.abs(this.targetY - this.y) <= this.speed) {
      this.x = this.targetX;
      this.y = this.targetY;
    }
  }

  move(inputDirection: CONTROLLER_ENUM) {
    switch (inputDirection) {
      case CONTROLLER_ENUM.TOP:
        this.targetY -= 1;
        break;
      case CONTROLLER_ENUM.BOTTOM:
        this.targetY += 1;
        break;
      case CONTROLLER_ENUM.LEFT:
        this.targetX -= 1;
        break;
      case CONTROLLER_ENUM.RIGHT:
        this.targetX += 1;
        break;
      case CONTROLLER_ENUM.TURNLEFT:
        switch (this.direction) {
          case DIRECTION_ENUM.TOP:
            this.direction = DIRECTION_ENUM.LEFT;
            break;
          case DIRECTION_ENUM.LEFT:
            this.direction = DIRECTION_ENUM.BOTTOM;
            break;
          case DIRECTION_ENUM.BOTTOM:
            this.direction = DIRECTION_ENUM.RIGHT;
            break;
          case DIRECTION_ENUM.RIGHT:
            this.direction = DIRECTION_ENUM.TOP;
            break;
        }
        this.state = ENTITY_STATE_ENUM.TURNLEFT;
        break;
    }
    // console.log(this.targetX, this.targetY, this.x, this.y);
  }
}
