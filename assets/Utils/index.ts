import { Node, UITransform, Layers, SpriteFrame } from 'cc'

export const createUINode = (name: string = '') => {
  const node = new Node(name)
  const transform = node.addComponent(UITransform)
  transform.setAnchorPoint(0, 1)  // 设置左上角为原点

  // node在设置layer后才会被渲染
  // node.layer = 1 << 25  // UI_2D在项目设置中的index是25
  node.layer = 1 << Layers.nameToLayer('UI_2D')
  // node.layer = Layers.Enum.UI_2D

  return node
}

export const randomByRange = (min: number, max: number) => Math.floor(Math.random() * (max - min) + min)

const reg = /\((\d+)\)/   // 匹配括号中的数字

const getNunberWithinString = (str: string) => {
  return parseInt(str.match(reg)[1] || '0');
}
export const sortSpriteFrame = (spriteFrames: SpriteFrame[]) => {
  return spriteFrames.sort((a, b) => {
    return getNunberWithinString(a.name) - getNunberWithinString(b.name);
  })  // 从小到大排序
}
