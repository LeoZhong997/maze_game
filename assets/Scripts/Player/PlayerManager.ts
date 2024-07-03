import { _decorator } from "cc";
import { CONTROLLER_ENUM, DIRECTION_ENUM, ENTITY_STATE_ENUM, ENTITY_TYPE_ENUM, EVENT_ENUM } from "../../Enums";
import EventManager from "../../Runtime/EventManager";
import { PlayerStateMachine } from "./PLayerStateMachine";
import { EntityManager } from "../../Base/EntityManager";
import DataManager from "../../Runtime/DataManager";
const { ccclass, property } = _decorator;

@ccclass('PlayerManager')
export class PlayerManager extends EntityManager {
  targetX: number = 0;
  targetY: number = 0;
  private readonly speed = 1 / 10;

  async init() {
    this.fsm = this.addComponent(PlayerStateMachine);
    await this.fsm.init();   // 有异步操作，使用Promise list等待所有资源加载后才退出

    super.init({
      x: 2,
      y: 8,
      type: ENTITY_TYPE_ENUM.PLAYER,
      direction: DIRECTION_ENUM.TOP,
      state: ENTITY_STATE_ENUM.IDLE
    })
    this.targetX = this.x;
    this.targetY = this.y;

    // 注册监听事件
    EventManager.Instance.on(EVENT_ENUM.PLAYER_CTRL, this.inputHandle, this);
  }

  update() {
    this.updateXY();
    super.update();
  }

  updateXY() {
    if (this.targetX < this.x) {
      this.x -= this.speed;
    } else if (this.targetX > this.x) {
      this.x += this.speed;
    }

    if (this.targetY < this.y) {
      this.y -= this.speed;
    } else if (this.targetY > this.y) {
      this.y += this.speed;
    }

    if (Math.abs(this.targetX - this.x) <= this.speed && Math.abs(this.targetY - this.y) <= this.speed) {
      this.x = this.targetX;
      this.y = this.targetY;
    }
  }

  inputHandle(inputDirection: CONTROLLER_ENUM) {
    if (this.willBlock(inputDirection)) {
      console.log('will block');
      return;
    }

    this.move(inputDirection)
  }

  willBlock(inputDirection: CONTROLLER_ENUM) {
    const {targetX: x, targetY: y, direction} = this;
    const {tileInfo} = DataManager.Instance;

    const playerNextAbsPos = {x: 0, y: 0};
    const weapenNextAbsPos = {x: 0, y: 0};

    if (
      inputDirection === CONTROLLER_ENUM.TOP ||
      inputDirection === CONTROLLER_ENUM.BOTTOM ||
      inputDirection === CONTROLLER_ENUM.LEFT ||
      inputDirection === CONTROLLER_ENUM.RIGHT
    ) {
      let nextState: ENTITY_STATE_ENUM = ENTITY_STATE_ENUM.IDLE;
      switch(inputDirection) {
        case CONTROLLER_ENUM.TOP:
          nextState = ENTITY_STATE_ENUM.BLOCKFRONT;
          break;
        case CONTROLLER_ENUM.BOTTOM:
          nextState = ENTITY_STATE_ENUM.BLOCKBACK;
          break;
        case CONTROLLER_ENUM.LEFT:
          nextState = ENTITY_STATE_ENUM.BLOCKLEFT;
          break;
        case CONTROLLER_ENUM.RIGHT:
          nextState = ENTITY_STATE_ENUM.BLOCKRIGHT;
          break;
      }
      switch (inputDirection) {
        case CONTROLLER_ENUM.TOP:
          playerNextAbsPos.y -= 1;
          weapenNextAbsPos.y -= 1;
          break;
        case CONTROLLER_ENUM.BOTTOM:
          playerNextAbsPos.y += 1;
          weapenNextAbsPos.y += 1;
          break;
        case CONTROLLER_ENUM.LEFT:
          playerNextAbsPos.x -= 1;
          weapenNextAbsPos.x -= 1;
          break;
        case CONTROLLER_ENUM.RIGHT:
          playerNextAbsPos.x += 1;
          weapenNextAbsPos.x += 1;
          break;
      }
      // console.log('inputDirection', playerNextAbsPos, weapenNextAbsPos);
      switch (direction) {
        case DIRECTION_ENUM.TOP:
          weapenNextAbsPos.y -= 1;
          break;
        case DIRECTION_ENUM.BOTTOM:
          weapenNextAbsPos.y += 1;
          break;
        case DIRECTION_ENUM.LEFT:
          weapenNextAbsPos.x -= 1;
          break;
        case DIRECTION_ENUM.RIGHT:
          weapenNextAbsPos.x += 1;
          break;
      }
      // console.log('direction', playerNextAbsPos, weapenNextAbsPos);

      const playerNextX = x + playerNextAbsPos.x;
      const playerNextY = y + playerNextAbsPos.y;
      const weapenNextX = x + weapenNextAbsPos.x;
      const weapenNextY = y + weapenNextAbsPos.y;
      if (playerNextY < 0 || playerNextX < 0) {
        this.state = nextState;
        return true;
      }

      const playerTile = tileInfo[playerNextX][playerNextY]
      const weapenTile = tileInfo[weapenNextX][weapenNextY]

      if (playerTile && playerTile.moveable && (!weapenTile || weapenTile.turnable)) {
        // empty
      } else {
        this.state = nextState;
        return true;
      }
    } else if (
      inputDirection === CONTROLLER_ENUM.TURNLEFT ||
      inputDirection === CONTROLLER_ENUM.TURNRIGHT
    ) {
      let nextState: ENTITY_STATE_ENUM = ENTITY_STATE_ENUM.IDLE;;
      switch (inputDirection) {
        case CONTROLLER_ENUM.TURNLEFT:
          nextState = ENTITY_STATE_ENUM.BLOCKTURNLEFT;
          switch (direction) {
            case DIRECTION_ENUM.TOP:
              weapenNextAbsPos.x -= 1;
              weapenNextAbsPos.y -= 1;
              break;
            case DIRECTION_ENUM.BOTTOM:
              weapenNextAbsPos.x += 1;
              weapenNextAbsPos.y += 1;
              break;
            case DIRECTION_ENUM.LEFT:
              weapenNextAbsPos.x -= 1;
              weapenNextAbsPos.y += 1;
              break;
            case DIRECTION_ENUM.RIGHT:
              weapenNextAbsPos.x += 1;
              weapenNextAbsPos.y -= 1;
              break;
          }
          break;
        case CONTROLLER_ENUM.TURNRIGHT:
          nextState = ENTITY_STATE_ENUM.BLOCKTURNRIGHT;
          switch (direction) {
            case DIRECTION_ENUM.TOP:
              weapenNextAbsPos.x += 1;
              weapenNextAbsPos.y -= 1;
              break;
            case DIRECTION_ENUM.BOTTOM:
              weapenNextAbsPos.x -= 1;
              weapenNextAbsPos.y += 1;
              break;
            case DIRECTION_ENUM.LEFT:
              weapenNextAbsPos.x -= 1;
              weapenNextAbsPos.y -= 1;
              break;
            case DIRECTION_ENUM.RIGHT:
              weapenNextAbsPos.x += 1;
              weapenNextAbsPos.y += 1;
              break;
          }
          break;
      }
      // console.log('inputDirection, direction', weapenNextAbsPos);
      const weapenNextX = x + weapenNextAbsPos.x;
      const weapenNextY = y + weapenNextAbsPos.y;

      if (
        (!tileInfo[x][weapenNextY] || tileInfo[x][weapenNextY].turnable) &&
        (!tileInfo[weapenNextX][y] || tileInfo[weapenNextX][y].turnable) &&
        (!tileInfo[weapenNextX][weapenNextY] || tileInfo[weapenNextX][weapenNextY].turnable)
      ) {
        // empty
      } else {
        this.state = nextState;
        return true;
      }
    }

    return false;
  }

  move(inputDirection: CONTROLLER_ENUM) {
    switch (inputDirection) {
      case CONTROLLER_ENUM.TOP:
        this.targetY -= 1;
        break;
      case CONTROLLER_ENUM.BOTTOM:
        this.targetY += 1;
        break;
      case CONTROLLER_ENUM.LEFT:
        this.targetX -= 1;
        break;
      case CONTROLLER_ENUM.RIGHT:
        this.targetX += 1;
        break;
      case CONTROLLER_ENUM.TURNLEFT:
        switch (this.direction) {
          case DIRECTION_ENUM.TOP:
            this.direction = DIRECTION_ENUM.LEFT;
            break;
          case DIRECTION_ENUM.LEFT:
            this.direction = DIRECTION_ENUM.BOTTOM;
            break;
          case DIRECTION_ENUM.BOTTOM:
            this.direction = DIRECTION_ENUM.RIGHT;
            break;
          case DIRECTION_ENUM.RIGHT:
            this.direction = DIRECTION_ENUM.TOP;
            break;
        }
        this.state = ENTITY_STATE_ENUM.TURNLEFT;
        break;
      case CONTROLLER_ENUM.TURNRIGHT:
        switch (this.direction) {
          case DIRECTION_ENUM.TOP:
            this.direction = DIRECTION_ENUM.RIGHT;
            break;
          case DIRECTION_ENUM.LEFT:
            this.direction = DIRECTION_ENUM.TOP;
            break;
          case DIRECTION_ENUM.BOTTOM:
            this.direction = DIRECTION_ENUM.LEFT;
            break;
          case DIRECTION_ENUM.RIGHT:
            this.direction = DIRECTION_ENUM.BOTTOM;
            break;
        }
        this.state = ENTITY_STATE_ENUM.TURNRIGHT;
        break;
    }
    // console.log(this.targetX, this.targetY, this.x, this.y);
  }
}
