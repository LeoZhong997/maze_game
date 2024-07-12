import { _decorator, Component, director, Label, Node, ProgressBar, resources } from 'cc';
import FaderManager from '../../Runtime/FaderManager';
import { SCENE_ENUM } from '../../Enums';
const { ccclass, property } = _decorator;

@ccclass('LoadingManager')
export class LoadingManager extends Component {
  @property(ProgressBar) // 获取进度条的引用
  bar: ProgressBar = null;
  @property(Label)
  label: Label = null;
  onLoad() {
    resources.preloadDir(
      'texture',
      (cur, total) => {
        // cur: 当前已加载的文件，total：需要加载的文件
        this.bar.progress = cur / total;
        this.label.string = `Loading ${cur} / Total ${total}`;
      }, // 加载过程中的回调
      () => {
        director.loadScene(SCENE_ENUM.START);
      }, //加载完成后的回调
    );
  }
}
