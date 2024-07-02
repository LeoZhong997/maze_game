
import { _decorator, Component, Layers, Node, resources, Sprite, SpriteFrame, UITransform } from 'cc';
const { ccclass, property } = _decorator;
import Levels from '../../Levels';
import { TILE_TYPE_ENUM } from '../../Enums';

export const TILE_WIDTH = 55;
export const TILE_HEIGHT = 55;


@ccclass('TileManager')
export class TileManager extends Component {
  type: TILE_TYPE_ENUM;
  moveable: boolean;
  turnable: boolean;

  init (type: TILE_TYPE_ENUM, spriteFrame: SpriteFrame, i: number, j: number) {
    this.type = type;
    switch (this.type) {
      case TILE_TYPE_ENUM.FLOOR:
        this.moveable = true
        this.turnable = true
        break
      case TILE_TYPE_ENUM.CLIFF_LEFT:
      case TILE_TYPE_ENUM.CLIFF_CENTER:
      case TILE_TYPE_ENUM.CLIFF_RIGHT:
        this.moveable = false
        this.turnable = true
        break
      case TILE_TYPE_ENUM.WALL_ROW:
      case TILE_TYPE_ENUM.WALL_COLUMN:
      case TILE_TYPE_ENUM.WALL_LEFT_TOP:
      case TILE_TYPE_ENUM.WALL_RIGHT_TOP:
      case TILE_TYPE_ENUM.WALL_LEFT_BOTTOM:
      case TILE_TYPE_ENUM.WALL_RIGHT_BOTTOM:
        this.moveable = false
        this.turnable = false
        break
    }

    const sprite = this.addComponent(Sprite);
    sprite.spriteFrame = spriteFrame

    const transform = this.getComponent(UITransform)
    transform.setContentSize(TILE_WIDTH, TILE_HEIGHT)

    // cocos的原点在左下角，瓦片地图的原点在左上角
    this.node.setPosition(i * TILE_WIDTH, -j * TILE_HEIGHT)
  }
}

