import { _decorator, Component, Node } from 'cc';
import { TileMapManager } from '../Tile/TileMapManager';
import { createUINode } from '../../Utils';
import Levels, { ILevel } from '../../Levels';
import DataManager from '../../Runtime/DataManager';
import { TILE_HEIGHT, TILE_WIDTH } from '../Tile/TileManager';
import EventManager from '../../Runtime/EventManager';
import { DIRECTION_ENUM, ENTITY_STATE_ENUM, ENTITY_TYPE_ENUM, EVENT_ENUM } from '../../Enums';
import { PlayerManager } from '../Player/PlayerManager';
import { WoodenSkeletonManager } from '../WoodenSkeleton/WoodenSkeletonManager';
import { DoorManager } from '../Door/DoorManager';
import { IronSkeletonManager } from '../IronSkeleton/IronSkeletonManager';
import { BurstManager } from '../Burst/BurstManager';
import { SpikesManager } from '../Spikes/SpikesManager';
const { ccclass, property } = _decorator;

@ccclass('BattleManager')
export class BattleManager extends Component {
  level: ILevel;
  stage: Node;

  onLoad() {
    // 绑定事件
    EventManager.Instance.on(EVENT_ENUM.NEXT_LEVEL, this.nextLevel, this);
  }

  onDestroy() {
    // 解绑事件
    EventManager.Instance.off(EVENT_ENUM.NEXT_LEVEL, this.nextLevel);
  }

  start() {
    this.generateStage();
    this.initLevel();
  }

  initLevel() {
    const level = Levels[`level${DataManager.Instance.levelIndex}`];
    if (level) {
      this.clearLevel();
      this.level = level;

      DataManager.Instance.mapInfo = level.mapInfo;
      DataManager.Instance.mapColCount = level.mapInfo.length || 0;
      DataManager.Instance.mapRowCount = level.mapInfo[0].length || 0;

      this.generateTileMap();
      this.generateBursts();
      this.generateSpikes();
      this.generatePlayer();
      this.generateEnemies();
      this.generateDoor();
    }
  }

  nextLevel() {
    DataManager.Instance.levelIndex++;
    this.initLevel();
  }

  clearLevel() {
    this.stage.destroyAllChildren();
    DataManager.Instance.reset();
  }

  generateStage() {
    this.stage = createUINode('stage'); // 包含地图、玩家、敌人
    this.stage.setParent(this.node);
    console.log('stage.parent=', this.stage.parent.name);
  }

  async generateTileMap() {
    const tileMap = createUINode('tileMap');
    tileMap.setParent(this.stage);
    console.log('tileMap.parent=', tileMap.parent.name);

    const tileMapManger = tileMap.addComponent(TileMapManager);
    await tileMapManger.init();

    this.adaptPos();
  }

  async generatePlayer() {
    const player = createUINode('player');
    player.setParent(this.stage);

    const playerManger = player.addComponent(PlayerManager);
    await playerManger.init({
      x: 2,
      y: 8,
      type: ENTITY_TYPE_ENUM.PLAYER,
      direction: DIRECTION_ENUM.TOP,
      state: ENTITY_STATE_ENUM.IDLE,
    });
    DataManager.Instance.player = playerManger;
    EventManager.Instance.emit(EVENT_ENUM.PLAYER_BORN, true);
  }

  async generateEnemies() {
    const wooden_enemy = createUINode('wooden_enemy');
    wooden_enemy.setParent(this.stage);

    const woodenSkeletonManager = wooden_enemy.addComponent(WoodenSkeletonManager);
    await woodenSkeletonManager.init({
      x: 3,
      y: 5,
      type: ENTITY_TYPE_ENUM.WOODEN_SKELETON,
      direction: DIRECTION_ENUM.TOP,
      state: ENTITY_STATE_ENUM.IDLE,
    });
    DataManager.Instance.enemies.push(woodenSkeletonManager);

    const iron_enemy = createUINode('iron_enemy');
    iron_enemy.setParent(this.stage);

    const ironSkeletonManager = iron_enemy.addComponent(IronSkeletonManager);
    await ironSkeletonManager.init({
      x: 7,
      y: 5,
      type: ENTITY_TYPE_ENUM.IRON_SKELETON,
      direction: DIRECTION_ENUM.TOP,
      state: ENTITY_STATE_ENUM.IDLE,
    });
    DataManager.Instance.enemies.push(ironSkeletonManager);
  }

  async generateDoor() {
    const door = createUINode('door');
    door.setParent(this.stage);

    const doorManager = door.addComponent(DoorManager);
    await doorManager.init({
      x: 7,
      y: 8,
      type: ENTITY_TYPE_ENUM.DOOR,
      direction: DIRECTION_ENUM.TOP,
      state: ENTITY_STATE_ENUM.IDLE,
    });
    DataManager.Instance.door = doorManager;
  }

  async generateBursts() {
    const burst = createUINode('burst');
    burst.setParent(this.stage);

    const burstManager = burst.addComponent(BurstManager);
    await burstManager.init({
      x: 2,
      y: 6,
      type: ENTITY_TYPE_ENUM.BURST,
      direction: DIRECTION_ENUM.TOP,
      state: ENTITY_STATE_ENUM.IDLE,
    });
    DataManager.Instance.bursts.push(burstManager);
  }

  async generateSpikes() {
    const spikes = createUINode('spikes');
    spikes.setParent(this.stage);

    const spikesManager = spikes.addComponent(SpikesManager);
    await spikesManager.init({
      x: 1,
      y: 6,
      type: ENTITY_TYPE_ENUM.SPIKES_ONE,
      count: 0,
    });
    DataManager.Instance.spikes.push(spikesManager);
  }

  adaptPos() {
    const { mapRowCount, mapColCount } = DataManager.Instance;
    const disX = (mapRowCount * TILE_WIDTH) / 2;
    const disY = (mapColCount * TILE_HEIGHT) / 2 + 80;
    this.stage.setPosition(-disX, disY);
  }
}
