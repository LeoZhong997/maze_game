import { _decorator } from 'cc';
import { CONTROLLER_ENUM, DIRECTION_ENUM, ENTITY_STATE_ENUM, ENTITY_TYPE_ENUM, EVENT_ENUM } from '../../Enums';
import EventManager from '../../Runtime/EventManager';
import { PlayerStateMachine } from './PLayerStateMachine';
import { EntityManager } from '../../Base/EntityManager';
import DataManager from '../../Runtime/DataManager';
const { ccclass, property } = _decorator;

@ccclass('PlayerManager')
export class PlayerManager extends EntityManager {
  targetX: number = 0;
  targetY: number = 0;
  isMoving = false;
  private readonly speed = 1 / 10;

  async init() {
    this.fsm = this.addComponent(PlayerStateMachine);
    await this.fsm.init(); // 有异步操作，使用Promise list等待所有资源加载后才退出

    super.init({
      x: 2,
      y: 8,
      type: ENTITY_TYPE_ENUM.PLAYER,
      direction: DIRECTION_ENUM.TOP,
      state: ENTITY_STATE_ENUM.IDLE,
    });
    this.targetX = this.x;
    this.targetY = this.y;

    // 注册监听事件
    EventManager.Instance.on(EVENT_ENUM.PLAYER_CTRL, this.inputHandle, this);
    EventManager.Instance.on(EVENT_ENUM.ATTACK_PLAYER, this.onDead, this);
  }

  onDestroy() {
    super.onDestroy();
    EventManager.Instance.off(EVENT_ENUM.PLAYER_CTRL, this.inputHandle);
    EventManager.Instance.off(EVENT_ENUM.ATTACK_PLAYER, this.onDead);
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

    if (
      Math.abs(this.targetX - this.x) <= this.speed &&
      Math.abs(this.targetY - this.y) <= this.speed &&
      this.isMoving
    ) {
      this.isMoving = false;
      this.x = this.targetX;
      this.y = this.targetY;
      EventManager.Instance.emit(EVENT_ENUM.PLAYER_MOVE_END);
    }
  }

  onDead(type: ENTITY_STATE_ENUM) {
    this.state = type;
  }

  inputHandle(inputDirection: CONTROLLER_ENUM) {
    if (this.isMoving) {
      return;
    }
    if (
      this.state === ENTITY_STATE_ENUM.DEATH ||
      this.state === ENTITY_STATE_ENUM.AIRDEATH ||
      this.state === ENTITY_STATE_ENUM.ATTACK
    ) {
      return;
    }

    const id = this.willAttack(inputDirection);
    if (id) {
      console.log(`will attack ${id}`);
      EventManager.Instance.emit(EVENT_ENUM.ATTACK_ENEMY, id);
      EventManager.Instance.emit(EVENT_ENUM.DOOR_OPEN); // 击败敌人后再触发更好？
      return;
    }

    if (this.willBlock(inputDirection)) {
      console.log('will block');
      return;
    }

    this.move(inputDirection);
  }

  willAttack(inputDirection: CONTROLLER_ENUM) {
    const enemies = DataManager.Instance.enemies.filter(enemy => enemy.state !== ENTITY_STATE_ENUM.DEATH);
    const { targetX: x, targetY: y, direction } = this;
    const weapenNextAbsPos = { x: 0, y: 0 };
    if (
      inputDirection === CONTROLLER_ENUM.TOP ||
      inputDirection === CONTROLLER_ENUM.BOTTOM ||
      inputDirection === CONTROLLER_ENUM.LEFT ||
      inputDirection === CONTROLLER_ENUM.RIGHT
    ) {
      switch (inputDirection) {
        case CONTROLLER_ENUM.TOP:
          weapenNextAbsPos.y -= 1;
          break;
        case CONTROLLER_ENUM.BOTTOM:
          weapenNextAbsPos.y += 1;
          break;
        case CONTROLLER_ENUM.LEFT:
          weapenNextAbsPos.x -= 1;
          break;
        case CONTROLLER_ENUM.RIGHT:
          weapenNextAbsPos.x += 1;
          break;
      }
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
    }
    for (let i = 0; i < enemies.length; i++) {
      const enemy = enemies[i];
      const { x: enemyX, y: enemyY, id: enemyId } = enemy;
      if (enemyX === x + weapenNextAbsPos.x && enemyY === y + weapenNextAbsPos.y) {
        this.state = ENTITY_STATE_ENUM.ATTACK;
        return enemyId;
      }
    }
    return '';
  }

  willBlock(inputDirection: CONTROLLER_ENUM) {
    const { targetX: x, targetY: y, direction } = this;
    const { tileInfo } = DataManager.Instance;

    const playerNextAbsPos = { x: 0, y: 0 };
    const weapenNextAbsPos = { x: 0, y: 0 };

    if (
      inputDirection === CONTROLLER_ENUM.TOP ||
      inputDirection === CONTROLLER_ENUM.BOTTOM ||
      inputDirection === CONTROLLER_ENUM.LEFT ||
      inputDirection === CONTROLLER_ENUM.RIGHT
    ) {
      let nextState: ENTITY_STATE_ENUM = ENTITY_STATE_ENUM.IDLE;
      switch (inputDirection) {
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

      const playerTile = tileInfo[playerNextX][playerNextY];
      const weapenTile = tileInfo[weapenNextX][weapenNextY];

      if (playerTile && playerTile.moveable && (!weapenTile || weapenTile.turnable)) {
        // empty
      } else {
        this.state = nextState;
        return true;
      }
    } else if (inputDirection === CONTROLLER_ENUM.TURNLEFT || inputDirection === CONTROLLER_ENUM.TURNRIGHT) {
      let nextState: ENTITY_STATE_ENUM = ENTITY_STATE_ENUM.IDLE;
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
        this.isMoving = true;
        break;
      case CONTROLLER_ENUM.BOTTOM:
        this.targetY += 1;
        this.isMoving = true;
        break;
      case CONTROLLER_ENUM.LEFT:
        this.targetX -= 1;
        this.isMoving = true;
        break;
      case CONTROLLER_ENUM.RIGHT:
        this.targetX += 1;
        this.isMoving = true;
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
        EventManager.Instance.emit(EVENT_ENUM.PLAYER_MOVE_END);
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
        EventManager.Instance.emit(EVENT_ENUM.PLAYER_MOVE_END);
        this.state = ENTITY_STATE_ENUM.TURNRIGHT;
        break;
    }
    // console.log(this.targetX, this.targetY, this.x, this.y);
  }
}
