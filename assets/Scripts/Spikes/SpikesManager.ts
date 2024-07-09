import { _decorator, Component, Sprite, UITransform } from 'cc';
import {
  ENTITY_STATE_ENUM,
  ENTITY_TYPE_ENUM,
  EVENT_ENUM,
  PARAMS_NAME_ENUM,
  SPIKES_TYPE_MAP_TOTAL_COUNT_ENUM,
} from '../../Enums';
import { randomByLength } from '../../Utils';
import { StateMachine } from '../../Base/StateMachine';
import { ISpikes } from '../../Levels';
import { TILE_HEIGHT, TILE_WIDTH } from '../Tile/TileManager';
import { SpikesStateMachine } from './SpikesStateMachine';
import EventManager from '../../Runtime/EventManager';
import DataManager from '../../Runtime/DataManager';
const { ccclass, property } = _decorator;

@ccclass('SpikesManager')
export class SpikesManager extends Component {
  id: string = randomByLength(12);
  x: number = 0;
  y: number = 0;
  fsm: StateMachine;

  private _count: number; // 地刺的当前点数，用于子状态内部的显示
  private _totalCount: number; // 地刺的总点数，用于选择哪种子状态
  private type: ENTITY_TYPE_ENUM;

  get count() {
    return this._count;
  }

  set count(newCount: number) {
    this._count = newCount;
    this.fsm.setParams(PARAMS_NAME_ENUM.SPIKES_CUR_COUNT, newCount);
  }

  get totalCount() {
    return this._totalCount;
  }

  set totalCount(newCount: number) {
    this._totalCount = newCount;
    this.fsm.setParams(PARAMS_NAME_ENUM.SPIKES_TOTAL_COUNT, newCount);
  }

  async init(params: ISpikes) {
    const sprite = this.addComponent(Sprite);
    sprite.sizeMode = Sprite.SizeMode.CUSTOM;
    const transform = this.getComponent(UITransform);
    transform.setContentSize(TILE_WIDTH * 4, TILE_HEIGHT * 4);

    this.fsm = this.addComponent(SpikesStateMachine);
    await this.fsm.init();

    // 初始状态
    this.x = params.x;
    this.y = params.y;
    this.type = params.type;
    this.totalCount = SPIKES_TYPE_MAP_TOTAL_COUNT_ENUM[this.type];
    this.count = params.count;

    EventManager.Instance.on(EVENT_ENUM.PLAYER_MOVE_END, this.onLoop, this);
  }

  onDestroy() {
    EventManager.Instance.off(EVENT_ENUM.PLAYER_MOVE_END, this.onLoop);
  }

  update() {
    // 虚拟坐标（原点在左上方，y向下为正方向）转换成渲染的坐标，该坐标是在stage的坐标系下（锚点在左上角，y向上为正方向）
    this.node.setPosition(this.x * TILE_WIDTH - 1.5 * TILE_WIDTH, -this.y * TILE_HEIGHT + 1.5 * TILE_HEIGHT);
  }

  onLoop() {
    if (this.count === this.totalCount) {
      this.count = 1; // 达到总点数时，会在状态机的动画结束时将count重置为0
    } else {
      this.count++;
    }

    this.onAttack();
  }

  backZero() {
    this.count = 0;
  }

  onAttack() {
    if (!DataManager.Instance.player) {
      return;
    }

    const { x: playerX, y: playerY } = DataManager.Instance.player;
    if (playerX === this.x && playerY === this.y && this.count === this.totalCount) {
      EventManager.Instance.emit(EVENT_ENUM.ATTACK_PLAYER, ENTITY_STATE_ENUM.DEATH);
    }
  }
}
