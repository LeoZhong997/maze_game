import { _decorator } from 'cc';
import { IEntity } from '../../Levels';
import { EntityManager } from '../../Base/EntityManager';
import { SmokeStateMachine } from './SmokeStateManager';
const { ccclass, property } = _decorator;

@ccclass('SmokeManager')
export class SmokeManager extends EntityManager {
  async init(params: IEntity) {
    this.fsm = this.addComponent(SmokeStateMachine);
    await this.fsm.init(); // 有异步操作，使用Promise list等待所有资源加载后才退出

    super.init(params);
  }
}
