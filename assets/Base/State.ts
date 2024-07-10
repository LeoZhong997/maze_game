import { AnimationClip, Sprite, SpriteFrame, UITransform, animation } from 'cc';
import ResourceManager from '../Runtime/ResourceManager';
import { StateMachine } from './StateMachine';
import { sortSpriteFrame } from '../Utils';

export const ANIMATION_SPEED = 1 / 8;

/***
 * 1. 需要知道 AnimationClip
 * 2. 需要播放动画的能力 animation
 */
export default class State {
  private animationClip: AnimationClip;

  constructor(
    private fsm: StateMachine,
    private path: string,
    private wrapMode: AnimationClip.WrapMode = AnimationClip.WrapMode.Normal,
    private speed: number = ANIMATION_SPEED,
    private events: any[] = [],
  ) {
    this.init();
  }

  async init() {
    // 加载图像资源
    // const spriteFrames = await ResourceManager.Instance.loadDir(this.path)
    const promise = ResourceManager.Instance.loadDir(this.path);
    this.fsm.waitingList.push(promise);
    const spriteFrames = await promise;

    const track = new animation.ObjectTrack(); // 创建一个对象轨道
    // 指定轨道路径，即指定组件为 Sprite 的 "spriteFrame" 属性
    track.path = new animation.TrackPath().toComponent(Sprite).toProperty('spriteFrame');
    // 获取关键帧列表：时间；变化的属性，即spriteFrame
    // sortSpriteFrame修复异步资源加载顺序不一致的问题
    const frames: Array<[number, SpriteFrame]> = sortSpriteFrame(spriteFrames).map((spriteFrame, index) => [
      this.speed * index,
      spriteFrame,
    ]);
    // 为单通道的曲线添加关键帧
    track.channel.curve.assignSorted(frames);

    // 最后将轨道添加到动画剪辑以应用
    this.animationClip = new AnimationClip();
    this.animationClip.addTrack(track);
    this.animationClip.name = this.path;
    this.animationClip.duration = frames.length * this.speed; // 整个动画剪辑的周期
    this.animationClip.wrapMode = this.wrapMode; // 播放方式

    for (const event of this.events) {
      this.animationClip.events.push(event);
    }
    this.animationClip.updateEventDatas(); // 不添加不触发动画的帧事件
  }

  run() {
    // 先判断this.fsm.animationComponent.defaultClip是否为空，不为空再判断是否相等
    if (this.fsm.animationComponent?.defaultClip?.name === this.animationClip.name) {
      return; // 避免重复播放
    }
    this.fsm.animationComponent.defaultClip = this.animationClip;
    this.fsm.animationComponent.play();
  }
}
