import { SpriteFrame, resources } from "cc";
import Singleton from "../Base/Singleton";
import { ITile } from "../Levels";

export default class ResourceManager extends Singleton{

  static get Instance() {
    return super.getInstance<ResourceManager>();
  }

  loadDir (path: string, type: typeof SpriteFrame = SpriteFrame) {
    // 回调函数封装成Promise
    return new Promise<SpriteFrame[]>((resolve, reject) => {
      resources.loadDir(path, type, (err, asset) => {
        if (err) {
          reject(err);
          return;
        }

        resolve(asset); // 输出
      });
    })
  }
}

