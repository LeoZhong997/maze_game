import { Node, UITransform, Layers } from 'cc'

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
