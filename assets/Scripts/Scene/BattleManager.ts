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
    EventManager.Instance.on(EVENT_ENUM.PLAYER_MOVE_END, this.checkArrived, this);
  }

  onDestroy() {
    // 解绑事件
    EventManager.Instance.off(EVENT_ENUM.NEXT_LEVEL, this.nextLevel);
    EventManager.Instance.off(EVENT_ENUM.PLAYER_MOVE_END, this.nextLevel);
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
    await playerManger.init(this.level.player);
    DataManager.Instance.player = playerManger;
    EventManager.Instance.emit(EVENT_ENUM.PLAYER_BORN, true);
  }

  async generateEnemies() {
    const promise = [];
    for (let i = 0; i < this.level.enemies.length; i++) {
      const enemy = this.level.enemies[i];
      const node = createUINode(`enemy_${i}`);
      node.setParent(this.stage);

      const mangerClass = enemy.type === ENTITY_TYPE_ENUM.SKELETON_WOODEN ? WoodenSkeletonManager : IronSkeletonManager;
      const manger = node.addComponent(mangerClass);
      // await manger.init(enemy);
      promise.push(manger.init(enemy));
      DataManager.Instance.enemies.push(manger);
    }
    await Promise.all(promise);
  }

  async generateDoor() {
    const door = createUINode('door');
    door.setParent(this.stage);

    const doorManager = door.addComponent(DoorManager);
    await doorManager.init(this.level.door);
    DataManager.Instance.door = doorManager;
  }

  async generateBursts() {
    const promise = [];
    for (let i = 0; i < this.level.bursts.length; i++) {
      const burst = this.level.bursts[i];
      const node = createUINode(`burst_${i}`);
      node.setParent(this.stage);

      const manger = node.addComponent(BurstManager);
      // await manger.init(burst);
      promise.push(manger.init(burst));
      DataManager.Instance.bursts.push(manger);
    }
    await Promise.all(promise);
  }

  async generateSpikes() {
    const promise = [];
    for (let i = 0; i < this.level.spikes.length; i++) {
      const spike = this.level.spikes[i];
      const node = createUINode(`spike_${i}`);
      node.setParent(this.stage);

      const manger = node.addComponent(SpikesManager);
      // await manger.init(burst);
      promise.push(manger.init(spike));
      DataManager.Instance.spikes.push(manger);
    }
    await Promise.all(promise);
  }

  checkArrived() {
    const { x: playerX, y: playerY } = DataManager.Instance.player;
    const { x: doorX, y: doorY, state: doorState } = DataManager.Instance.door;
    if (playerX === doorX && playerY === doorY && doorState === ENTITY_STATE_ENUM.DEATH) {
      EventManager.Instance.emit(EVENT_ENUM.NEXT_LEVEL);
    }
  }

  adaptPos() {
    const { mapRowCount, mapColCount } = DataManager.Instance;
    const disX = (mapRowCount * TILE_WIDTH) / 2;
    const disY = (mapColCount * TILE_HEIGHT) / 2 + 80;
    this.stage.setPosition(-disX, disY);
  }
}
