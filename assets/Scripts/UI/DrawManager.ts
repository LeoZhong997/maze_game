import { _decorator, Color, Component, Graphics, view, game, BlockInputEvents, UITransform } from 'cc';
const { ccclass, property } = _decorator;

const SCREEN_WIDTH = view.getVisibleSize().width;
const SCREEN_HEIGHT = view.getVisibleSize().height;

enum FADE_STATE_ENUM {
  IDLE = 'IDLE',
  FADE_IN = 'FADE_IN',
  FADE_OUT = 'FADE_OUT',
}

export const DEFAULT_DURATION = 2000;

@ccclass('DrawManager')
export class DrawManager extends Component {
  private ctx: Graphics;
  private state: FADE_STATE_ENUM = FADE_STATE_ENUM.IDLE;
  private oldTime: number = 0;
  private duration: number = DEFAULT_DURATION;
  private fadeResolve: (value: PromiseLike<null>) => void;
  private block: BlockInputEvents;

  init() {
    this.ctx = this.addComponent(Graphics);
    this.block = this.addComponent(BlockInputEvents); // 屏蔽输入
    const transform = this.addComponent(UITransform);
    transform.setAnchorPoint(0.5, 0.5);
    transform.setContentSize(SCREEN_WIDTH, SCREEN_HEIGHT); // 全屏屏蔽输入

    this.setAlpha(1); // 纯黑背景
  }

  setAlpha(percent: number) {
    this.ctx.clear(); // 清空画布
    this.ctx.rect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT); // 绘制一个矩形
    this.ctx.fillColor = new Color(0, 0, 0, percent * 255); // 设置填充颜色
    this.ctx.fill(); // 填充
    this.block.enabled = percent === 1; // 不可见时，屏蔽输入
  }

  /***
   * 随着时间变化，逐渐改变透明度
   */
  update() {
    const percent = (game.totalTime - this.oldTime) / this.duration;
    switch (this.state) {
      case FADE_STATE_ENUM.FADE_IN:
        if (percent < 1) {
          this.setAlpha(percent);
        } else {
          this.setAlpha(1);
          this.state = FADE_STATE_ENUM.IDLE;
          this.fadeResolve(null);
        }
        break;
      case FADE_STATE_ENUM.FADE_OUT:
        if (percent < 1) {
          this.setAlpha(1 - percent);
        } else {
          this.setAlpha(0);
          this.state = FADE_STATE_ENUM.IDLE;
          this.fadeResolve(null);
        }
        break;
    }
  }

  fadeIn(duration: number = DEFAULT_DURATION) {
    this.setAlpha(0); // 从透明度0开始渐变到1，由可见到不可见
    this.duration = duration;
    this.oldTime = game.totalTime;
    this.state = FADE_STATE_ENUM.FADE_IN;
    // 因为时间是不确定的，因此返回promise，更好地操作代码的同步和异步问题
    return new Promise(resolve => {
      this.fadeResolve = resolve;
    });
  }

  fadeOut(duration: number = DEFAULT_DURATION) {
    this.setAlpha(1); // 从透明度1开始渐变到0，由不可见到可见
    this.duration = duration;
    this.oldTime = game.totalTime;
    this.state = FADE_STATE_ENUM.FADE_OUT;
    return new Promise(resolve => {
      this.fadeResolve = resolve;
    });
  }
}
