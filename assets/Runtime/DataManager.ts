import Singleton from "../Base/Singleton";
import { ITile } from "../Levels";
import { TileManager } from "../Scripts/Tile/TileManager";

export default class DataManager extends Singleton{

  static get Instance() {
    return super.getInstance<DataManager>();
  }

  mapInfo: Array<Array<ITile>>
  tileInfo: Array<Array<TileManager>>
  mapRowCount: number = 0
  mapColCount: number = 0
  levelIndex: number = 1

  reset() {
    this.mapInfo = [];
    this.tileInfo = [];
    this.mapRowCount = 0;
    this.mapColCount = 0;
  }
}

