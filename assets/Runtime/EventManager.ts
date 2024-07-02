import Singleton from "../Base/Singleton";

interface IItem {
  func: Function
  ctx: unknown  // 用于绑定上下文
}

export default class EventManager extends Singleton{

  static get Instance() {
    return super.getInstance<EventManager>();
  }

  // 事件字典
  private eventDic: Map<string, Array<IItem>> = new Map();

  // 绑定事件
  on(eventName: string, func: Function, ctx?: unknown) {
    if (this.eventDic.has(eventName)) {
      this.eventDic.get(eventName).push({func, ctx});
    } else {
      this.eventDic.set(eventName, [{func, ctx}]);
    }
1 }

  // 解绑事件
  off(eventName: string, func:Function) {
    if (this.eventDic.has(eventName)) {
      const index = this.eventDic.get(eventName).findIndex(i => i.func === func);
      index > -1 && this.eventDic.get(eventName).splice(index, 1);  // 删除事件
    }
  }

  // 触发
  emit(eventName: string, ...params: unknown[]) {
    if (this.eventDic.has(eventName)) {
      this.eventDic.get(eventName).forEach(({func, ctx}) => {
        ctx ? func.apply(ctx, params) : func(...params)  // 调用每个函数
      });
    }
  }

  // 清空
  clear() {
    this.eventDic.clear();
  }

}

