import { _decorator, Component, director, Label, Node } from 'cc';
import { TileMapManager } from '../Tile/TileMapManager';
import { createUINode } from '../../Utils';
import Levels, { ILevel } from '../../Levels';
import DataManager, { IRecord } from '../../Runtime/DataManager';
import { TILE_HEIGHT, TILE_WIDTH } from '../Tile/TileManager';
import EventManager from '../../Runtime/EventManager';
import { DIRECTION_ENUM, ENTITY_STATE_ENUM, ENTITY_TYPE_ENUM, EVENT_ENUM, SCENE_ENUM } from '../../Enums';
import { PlayerManager } from '../Player/PlayerManager';
import { WoodenSkeletonManager } from '../WoodenSkeleton/WoodenSkeletonManager';
import { DoorManager } from '../Door/DoorManager';
import { IronSkeletonManager } from '../IronSkeleton/IronSkeletonManager';
import { BurstManager } from '../Burst/BurstManager';
import { SpikesManager } from '../Spikes/SpikesManager';
import { SmokeManager } from '../Smoke/SmokeManager';
import FaderManager from '../../Runtime/FaderManager';
import { ShakeManager } from '../UI/ShakeManager';
const { ccclass, property } = _decorator;

@ccclass('BattleManager')
export class BattleManager extends Component {
  @property(Label)
  levelDisplay: Label = null;

  level: ILevel;
  stage: Node;
  private smokeLayer: Node;
  private inited = false;

  onLoad() {
    EventManager.Instance.on(EVENT_ENUM.NEXT_LEVEL, this.nextLevel, this);
    EventManager.Instance.on(EVENT_ENUM.PLAYER_MOVE_END, this.checkArrived, this);
    EventManager.Instance.on(EVENT_ENUM.SHOW_SMOKE, this.generateSmoke, this);
    EventManager.Instance.on(EVENT_ENUM.RECORD_STEP, this.record, this);
    EventManager.Instance.on(EVENT_ENUM.REVOKE_STEP, this.revoke, this);
    EventManager.Instance.on(EVENT_ENUM.RESTART_LEVEL, this.initLevel, this);
    EventManager.Instance.on(EVENT_ENUM.OUT_BATTLE, this.outBattle, this);
  }

  onDestroy() {
    EventManager.Instance.off(EVENT_ENUM.NEXT_LEVEL, this.nextLevel);
    EventManager.Instance.off(EVENT_ENUM.PLAYER_MOVE_END, this.nextLevel);
    EventManager.Instance.off(EVENT_ENUM.SHOW_SMOKE, this.generateSmoke);
    EventManager.Instance.off(EVENT_ENUM.RECORD_STEP, this.record);
    EventManager.Instance.off(EVENT_ENUM.REVOKE_STEP, this.revoke);
    EventManager.Instance.off(EVENT_ENUM.RESTART_LEVEL, this.initLevel);
    EventManager.Instance.off(EVENT_ENUM.OUT_BATTLE, this.outBattle);
  }

  start() {
    this.generateStage();
    this.initLevel();
  }

  async initLevel() {
    const level = Levels[`level${DataManager.Instance.levelIndex}`];
    if (level) {
      if (this.inited) {
        await FaderManager.Instance.fadeIn();
      } else {
        await FaderManager.Instance.mask();
      }

      this.clearLevel();
      this.level = level;
      this.levelDisplay.string = `Level ${DataManager.Instance.levelIndex}`;

      DataManager.Instance.mapInfo = level.mapInfo;
      DataManager.Instance.mapColCount = level.mapInfo.length || 0;
      DataManager.Instance.mapRowCount = level.mapInfo[0].length || 0;

      await Promise.all([
        this.generateTileMap(),
        this.generateBursts(),
        this.generateSpikes(),
        this.generateEnemies(),
        this.generateDoor(),
        this.generateSmokeLayer(),
        this.generatePlayer(),
      ]);

      await FaderManager.Instance.fadeOut();
      this.inited = true;
    } else {
      this.outBattle();
    }
  }

  async outBattle() {
    await FaderManager.Instance.fadeIn();
    director.loadScene(SCENE_ENUM.START);
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
    this.stage.addComponent(ShakeManager);
  }

  async generateTileMap() {
    const tileMap = createUINode('tileMap');
    tileMap.setParent(this.stage);

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

  /***
   * 形成烟雾层，确保在player之前调用，保证烟雾层在player之后
   */
  async generateSmokeLayer() {
    this.smokeLayer = createUINode('smokeLayer');
    this.smokeLayer.setParent(this.stage);
  }

  async generateSmoke(x: number, y: number, direction: DIRECTION_ENUM) {
    // 从缓存池里找到一个Death状态的smoke，重用该实例
    const item = DataManager.Instance.smokes.find((smoke: SmokeManager) => smoke.state === ENTITY_STATE_ENUM.DEATH);
    if (item) {
      item.x = x;
      item.y = y;
      item.direction = direction;
      item.state = ENTITY_STATE_ENUM.IDLE;
      // 确保生成的位置一致
      item.node.setPosition(x * TILE_WIDTH - 1.5 * TILE_WIDTH, -y * TILE_HEIGHT + 1.5 * TILE_HEIGHT);
    } else {
      const smoke = createUINode('smoke');
      smoke.setParent(this.smokeLayer);

      const smokeManger = smoke.addComponent(SmokeManager);
      await smokeManger.init({
        x,
        y,
        direction,
        state: ENTITY_STATE_ENUM.IDLE,
        type: ENTITY_TYPE_ENUM.SMOKE,
      });
      DataManager.Instance.smokes.push(smokeManger);
    }
  }

  checkArrived() {
    if (!DataManager.Instance.player || !DataManager.Instance.door) {
      return;
    }

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

    this.stage.getComponent(ShakeManager).stop();
    this.stage.setPosition(-disX, disY);
  }

  /***
   * 记录场景信息
   */
  record() {
    const item: IRecord = {
      player: {
        x: DataManager.Instance.player.x,
        y: DataManager.Instance.player.y,
        direction: DataManager.Instance.player.direction,
        state:
          DataManager.Instance.player.state === ENTITY_STATE_ENUM.IDLE ||
          DataManager.Instance.player.state === ENTITY_STATE_ENUM.DEATH ||
          DataManager.Instance.player.state === ENTITY_STATE_ENUM.AIRDEATH
            ? DataManager.Instance.player.state
            : ENTITY_STATE_ENUM.IDLE,
        type: DataManager.Instance.player.type,
      },
      door: {
        x: DataManager.Instance.door.x,
        y: DataManager.Instance.door.y,
        direction: DataManager.Instance.door.direction,
        state: DataManager.Instance.door.state,
        type: DataManager.Instance.door.type,
      },
      enemies: DataManager.Instance.enemies.map(({ x, y, direction, state, type }) => ({
        x,
        y,
        direction,
        state,
        type,
      })),
      bursts: DataManager.Instance.bursts.map(({ x, y, direction, state, type }) => ({
        x,
        y,
        direction,
        state,
        type,
      })),
      spikes: DataManager.Instance.spikes.map(({ x, y, count, type }) => ({
        x,
        y,
        count,
        type,
      })),
    };
    DataManager.Instance.records.push(item);
  }

  /***
   * 游戏回退到上一步
   */
  revoke() {
    const item = DataManager.Instance.records.pop();
    if (item) {
      DataManager.Instance.player.x = DataManager.Instance.player.targetX = item.player.x;
      DataManager.Instance.player.y = DataManager.Instance.player.targetY = item.player.y;
      DataManager.Instance.player.direction = item.player.direction;
      DataManager.Instance.player.state = item.player.state;

      DataManager.Instance.door.x = item.door.x;
      DataManager.Instance.door.y = item.door.y;
      DataManager.Instance.door.direction = item.door.direction;
      DataManager.Instance.door.state = item.door.state;

      for (let i = 0; i < DataManager.Instance.enemies.length; i++) {
        const enemy = DataManager.Instance.enemies[i];
        const enemyItem = item.enemies[i];
        enemy.x = enemyItem.x;
        enemy.y = enemyItem.y;
        enemy.direction = enemyItem.direction;
        enemy.state = enemyItem.state;
      }

      for (let i = 0; i < DataManager.Instance.bursts.length; i++) {
        const burst = DataManager.Instance.bursts[i];
        const burstItem = item.bursts[i];
        burst.x = burstItem.x;
        burst.y = burstItem.y;
        burst.state = burstItem.state;
      }

      for (let i = 0; i < DataManager.Instance.spikes.length; i++) {
        const spike = DataManager.Instance.spikes[i];
        const spikeItem = item.spikes[i];
        spike.x = spikeItem.x;
        spike.y = spikeItem.y;
        spike.count = spikeItem.count;
        spike.type = spikeItem.type;
      }
    }
  }
}
