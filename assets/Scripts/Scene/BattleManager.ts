
import { _decorator, Component, Node } from 'cc';
import { TileMapManager } from '../Tile/TileMapManager';
import { createUINode } from '../../Utils';
import Levels, { ILevel } from '../../Levels';
import DataManager from '../../Runtime/DataManager';
import { TILE_HEIGHT, TILE_WIDTH } from '../Tile/TileManager';
import EventManager from '../../Runtime/EventManager';
import { EVENT_ENUM } from '../../Enums';
import { PlayerManager } from '../Player/PlayerManager';
const { ccclass, property } = _decorator;


@ccclass('BattleManager')
export class BattleManager extends Component {

  level: ILevel
  stage: Node

  onLoad() {
    // 绑定事件
    EventManager.Instance.on(EVENT_ENUM.NEXT_LEVEL, this.nextLevel, this)
  }

  onDestroy() {
    // 解绑事件
    EventManager.Instance.off(EVENT_ENUM.NEXT_LEVEL, this.nextLevel)
  }

  start () {
    this.generateStage()
    this.initLevel()
  }

  initLevel() {
    const level = Levels[`level${DataManager.Instance.levelIndex}`];
    if (level) {
      this.clearLevel()
      this.level = level

      DataManager.Instance.mapInfo = level.mapInfo
      DataManager.Instance.mapColCount = level.mapInfo.length || 0
      DataManager.Instance.mapRowCount = level.mapInfo[0].length || 0

      this.generateTileMap()
      this.generatePlayer()
    }
  }

  nextLevel() {
    DataManager.Instance.levelIndex++
    this.initLevel()
  }

  clearLevel() {
    this.stage.destroyAllChildren()
    DataManager.Instance.reset()
  }

  generateStage() {
    this.stage = createUINode('stage')    // 包含地图、玩家、敌人
    this.stage.setParent(this.node)
    console.log('stage.parent=', this.stage.parent.name)
  }

  generateTileMap() {
    const tileMap = createUINode('tileMap')
    tileMap.setParent(this.stage)
    console.log('tileMap.parent=', tileMap.parent.name)

    const tileMapManger = tileMap.addComponent(TileMapManager)
    tileMapManger.init()

    this.adaptPos()
  }

  generatePlayer() {
    const player = createUINode('player')
    player.setParent(this.stage)

    const playerManger = player.addComponent(PlayerManager)
    playerManger.init()
  }

  adaptPos() {
    const {mapRowCount, mapColCount} = DataManager.Instance
    const disX = mapRowCount * TILE_WIDTH / 2
    const disY = mapColCount * TILE_HEIGHT / 2 + 80
    this.stage.setPosition(-disX, disY)
  }
}

