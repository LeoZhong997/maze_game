import { _decorator, Component, Sprite, UITransform } from "cc";
import { CONTROLLER_ENUM, DIRECTION_ENUM, DIRECTION_ORDER_ENUM, ENTITY_STATE_ENUM, ENTITY_TYPE_ENUM, EVENT_ENUM, PARAMS_NAME_ENUM } from "../Enums";
import EventManager from "../Runtime/EventManager";
import { PlayerStateMachine } from "../Scripts/Player/PLayerStateMachine";
import { TILE_HEIGHT, TILE_WIDTH } from "../Scripts/Tile/TileManager";
import { IEntity } from "../Levels";
const { ccclass, property } = _decorator;

@ccclass('EntityManager')
export class EntityManager extends Component {
  x: number = 0;
  y: number = 0;
  fsm: PlayerStateMachine;

  private _direction: DIRECTION_ENUM;
  private _state: ENTITY_STATE_ENUM;
  private type: ENTITY_TYPE_ENUM;

  get direction() {
    return this._direction;
  }

  set direction(newDirection: DIRECTION_ENUM) {
    this._direction = newDirection;
    this.fsm.setParams(PARAMS_NAME_ENUM.DIRECTION, DIRECTION_ORDER_ENUM[this._direction])
  }

  get state() {
    return this._state;
  }

  set state(newState: ENTITY_STATE_ENUM) {
    this._state = newState;
    this.fsm.setParams(this._state, true)
  }

  init(params: IEntity) {
    const sprite = this.addComponent(Sprite);
    sprite.sizeMode = Sprite.SizeMode.CUSTOM;
    const transform = this.getComponent(UITransform);
    transform.setContentSize(TILE_WIDTH * 4, TILE_HEIGHT * 4);

    // 初始状态
    this.x = params.x;
    this.y = params.y;
    this.type = params.type;
    this.direction = params.direction;
    this.state = params.state;
  }

  update() {
    // 虚拟坐标（原点在左上方，y向下为正方向）转换成渲染的坐标，该坐标是在stage的坐标系下（锚点在左上角，y向上为正方向）
    this.node.setPosition(this.x * TILE_WIDTH - 1.5 * TILE_WIDTH, -this.y * TILE_HEIGHT + 1.5 * TILE_HEIGHT);
  }
}
