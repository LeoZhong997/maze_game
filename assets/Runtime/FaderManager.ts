import { game, RenderRoot2D } from 'cc';
import Singleton from '../Base/Singleton';
import { DEFAULT_DURATION, DrawManager } from '../Scripts/UI/DrawManager';
import { createUINode } from '../Utils';

export default class FaderManager extends Singleton {
  private _fader: DrawManager = null;

  static get Instance() {
    return super.getInstance<FaderManager>();
  }

  get fader() {
    if (this._fader !== null) {
      return this._fader;
    }

    const root = createUINode('faderRoot');
    root.addComponent(RenderRoot2D); // UI的渲染必须有RenderRoot2D组件

    const fadeNode = createUINode('fader');
    fadeNode.setParent(root);
    this._fader = fadeNode.addComponent(DrawManager);
    this._fader.init();

    game.addPersistRootNode(root); // 声明常驻根节点，不会在场景切换时被销毁
    return this._fader;
  }

  fadeIn(duration: number = DEFAULT_DURATION) {
    return this.fader.fadeIn(duration);
  }

  fadeOut(duration: number = DEFAULT_DURATION) {
    return this.fader.fadeOut(duration);
  }

  mask() {
    return this.fader.mask();
  }
}
