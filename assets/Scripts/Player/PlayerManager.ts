import { _decorator, Component, Sprite, UITransform, Animation, AnimationClip, animation, SpriteFrame } from "cc";
import { TILE_HEIGHT, TILE_WIDTH } from "../Tile/TileManager";
import { CONTROLLER_ENUM, DIRECTION_ENUM, DIRECTION_ORDER_ENUM, ENTITY_STATE_ENUM, EVENT_ENUM, PARAMS_TYPE_ENUM } from "../../Enums";
import EventManager from "../../Runtime/EventManager";
import { PlayerStateMachine } from "./PLayerStateMachine";
const { ccclass, property } = _decorator;

@ccclass('PlayerManager')
export class PlayerManager extends Component {
  x: number = 0;
  y: number = 0;
  targetX: number = 0;
  targetY: number = 0;
  private readonly speed = 1 / 10;
  fsm: PlayerStateMachine;

  private _direction: DIRECTION_ENUM;
  private _state: ENTITY_STATE_ENUM;

  get direction() {
    return this._direction;
  }

  set direction(newDirection: DIRECTION_ENUM) {
    this._direction = newDirection;
    this.fsm.setParams(PARAMS_TYPE_ENUM.DIRECTION, DIRECTION_ORDER_ENUM[this._direction])
  }

  get state() {
    return this._state;
  }

  set state(newState: ENTITY_STATE_ENUM) {
    this._state = newState;
    this.fsm.setParams(this._state, true)
  }

  async init() {
    const sprite = this.addComponent(Sprite);
    sprite.sizeMode = Sprite.SizeMode.CUSTOM;
    const transform = this.getComponent(UITransform);
    transform.setContentSize(TILE_WIDTH * 4, TILE_HEIGHT * 4);

    this.fsm = this.addComponent(PlayerStateMachine);
    await this.fsm.init();   // 有异步操作，使用Promise list等待所有资源加载后才退出
    this.direction = DIRECTION_ENUM.TOP;
    this.state = ENTITY_STATE_ENUM.IDLE;  // 初始状态

    // 注册监听事件
    EventManager.Instance.on(EVENT_ENUM.PLAYER_CTRL, this.move, this);
  }

  update() {
    this.updateXY();
    // 虚拟坐标（原点在左上方，y向下为正方向）转换成渲染的坐标，该坐标是在stage的坐标系下（锚点在左上角，y向上为正方向）
    this.node.setPosition(this.x * TILE_WIDTH - 1.5 * TILE_WIDTH, -this.y * TILE_HEIGHT + 1.5 * TILE_HEIGHT);
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
