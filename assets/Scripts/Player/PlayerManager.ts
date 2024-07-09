import { _decorator } from 'cc';
import { CONTROLLER_ENUM, DIRECTION_ENUM, ENTITY_STATE_ENUM, ENTITY_TYPE_ENUM, EVENT_ENUM } from '../../Enums';
import EventManager from '../../Runtime/EventManager';
import { PlayerStateMachine } from './PLayerStateMachine';
import { EntityManager } from '../../Base/EntityManager';
import DataManager from '../../Runtime/DataManager';
import { IEntity } from '../../Levels';
import { TileManager } from '../Tile/TileManager';
const { ccclass, property } = _decorator;

@ccclass('PlayerManager')
export class PlayerManager extends EntityManager {
  targetX: number = 0;
  targetY: number = 0;
  isMoving = false;
  private readonly speed = 1 / 10;

  async init(params: IEntity) {
    this.fsm = this.addComponent(PlayerStateMachine);
    await this.fsm.init(); // 有异步操作，使用Promise list等待所有资源加载后才退出

    super.init(params);
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
      this.state = ENTITY_STATE_ENUM.ATTACK;
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
    for (let i = 0; i < enemies.length; i++) {
      const enemy = enemies[i];
      const { x: enemyX, y: enemyY, id: enemyId } = enemy;
      if (
        inputDirection === CONTROLLER_ENUM.TOP &&
        direction === DIRECTION_ENUM.TOP &&
        enemyX === x &&
        enemyY === y - 2
      ) {
        return enemyId;
      } else if (
        inputDirection === CONTROLLER_ENUM.BOTTOM &&
        direction === DIRECTION_ENUM.BOTTOM &&
        enemyX === x &&
        enemyY === y + 2
      ) {
        return enemyId;
      } else if (
        inputDirection === CONTROLLER_ENUM.LEFT &&
        direction === DIRECTION_ENUM.LEFT &&
        enemyX === x - 2 &&
        enemyY === y
      ) {
        return enemyId;
      } else if (
        inputDirection === CONTROLLER_ENUM.RIGHT &&
        direction === DIRECTION_ENUM.RIGHT &&
        enemyX === x + 2 &&
        enemyY === y
      ) {
        return enemyId;
      }
    }
    return '';
  }

  willBlock(inputDirection: CONTROLLER_ENUM) {
    const { targetX: x, targetY: y, direction } = this;
    const { tileInfo, enemies, bursts, door, mapRowCount: row, mapColCount: column } = DataManager.Instance;

    const getNextPositions = (dx: number, dy: number) => {
      const nextX = x + dx;
      const nextY = y + dy;
      return { nextX, nextY };
    };

    const isOutOfMap = (nextX: number, nextY: number) => nextX < 0 || nextY < 0 || nextX >= row || nextY >= column;

    const isBlockingDoor = (nextX: number, nextY: number) =>
      door && door.state !== ENTITY_STATE_ENUM.DEATH && door.x === nextX && door.y === nextY;

    const isBlockingEnemy = (nextX: number, nextY: number) =>
      enemies.some(enemy => enemy.state !== ENTITY_STATE_ENUM.DEATH && enemy.x === nextX && enemy.y === nextY);

    // 即使地图的瓦片不存在，PLayer也可以走在地裂上面
    const isStandingBurst = (nextX: number, nextY: number) =>
      bursts.some(burst => burst.state !== ENTITY_STATE_ENUM.DEATH && burst.x === nextX && burst.y === nextY);

    const isBlockingTile = (nextPlayerTile: TileManager, nextWeaponTile: TileManager) =>
      !nextPlayerTile || !nextPlayerTile.moveable || (nextWeaponTile && !nextWeaponTile.turnable);

    const checkBlockingConditions = (
      dx: number,
      dy: number,
      wdx: number,
      wdy: number,
      blockState: ENTITY_STATE_ENUM,
    ) => {
      const { nextX: playerNextX, nextY: playerNextY } = getNextPositions(dx, dy);
      const { nextX: weaponNextX, nextY: weaponNextY } = getNextPositions(wdx, wdy);
      const nextPlayerTile = tileInfo[playerNextX]?.[playerNextY];
      const nextWeaponTile = tileInfo[weaponNextX]?.[weaponNextY];

      if (isOutOfMap(playerNextX, playerNextY)) {
        this.state = blockState;
        return true;
      }

      if (
        isBlockingDoor(playerNextX, playerNextY) ||
        isBlockingDoor(weaponNextX, weaponNextY) ||
        isBlockingEnemy(playerNextX, playerNextY) ||
        isBlockingEnemy(weaponNextX, weaponNextY)
      ) {
        this.state = blockState;
        return true;
      }

      if (isStandingBurst(playerNextX, playerNextY) && (!nextWeaponTile || nextWeaponTile.turnable)) {
        return false;
      }

      if (isBlockingTile(nextPlayerTile, nextWeaponTile)) {
        this.state = blockState;
        return true;
      }

      return false;
    };

    const checkTurnBlockigConditions = (dx: number, dy: number, blockState: ENTITY_STATE_ENUM) => {
      const { nextX, nextY } = getNextPositions(dx, dy);
      if (isBlockingDoor(x, nextY) || isBlockingDoor(nextX, y) || isBlockingDoor(nextX, nextY)) {
        this.state = blockState;
        return true;
      }

      if (isBlockingEnemy(x, nextY) || isBlockingEnemy(nextX, y) || isBlockingEnemy(nextX, nextY)) {
        this.state = blockState;
        return true;
      }

      if (
        (!tileInfo[x]?.[nextY] || tileInfo[x]?.[nextY].turnable) &&
        (!tileInfo[nextX]?.[y] || tileInfo[nextX]?.[y].turnable) &&
        (!tileInfo[nextX]?.[nextY] || tileInfo[nextX]?.[nextY].turnable)
      ) {
        // empty
      } else {
        this.state = blockState;
        return true;
      }
    };

    switch (inputDirection) {
      case CONTROLLER_ENUM.TOP:
        switch (direction) {
          case DIRECTION_ENUM.TOP:
            return checkBlockingConditions(0, -1, 0, -2, ENTITY_STATE_ENUM.BLOCKFRONT);
          case DIRECTION_ENUM.BOTTOM:
            return checkBlockingConditions(0, -1, 0, 0, ENTITY_STATE_ENUM.BLOCKBACK);
          case DIRECTION_ENUM.LEFT:
            return checkBlockingConditions(0, -1, -1, -1, ENTITY_STATE_ENUM.BLOCKRIGHT);
          case DIRECTION_ENUM.RIGHT:
            return checkBlockingConditions(0, -1, 1, -1, ENTITY_STATE_ENUM.BLOCKLEFT);
        }
        break;
      case CONTROLLER_ENUM.BOTTOM:
        switch (direction) {
          case DIRECTION_ENUM.TOP:
            return checkBlockingConditions(0, 1, 0, 0, ENTITY_STATE_ENUM.BLOCKBACK);
          case DIRECTION_ENUM.BOTTOM:
            return checkBlockingConditions(0, 1, 0, 2, ENTITY_STATE_ENUM.BLOCKFRONT);
          case DIRECTION_ENUM.LEFT:
            return checkBlockingConditions(0, 1, -1, 1, ENTITY_STATE_ENUM.BLOCKLEFT);
          case DIRECTION_ENUM.RIGHT:
            return checkBlockingConditions(0, 1, 1, 1, ENTITY_STATE_ENUM.BLOCKRIGHT);
        }
        break;
      case CONTROLLER_ENUM.LEFT:
        switch (direction) {
          case DIRECTION_ENUM.TOP:
            return checkBlockingConditions(-1, 0, -1, -1, ENTITY_STATE_ENUM.BLOCKLEFT);
          case DIRECTION_ENUM.BOTTOM:
            return checkBlockingConditions(-1, 0, -1, 1, ENTITY_STATE_ENUM.BLOCKRIGHT);
          case DIRECTION_ENUM.LEFT:
            return checkBlockingConditions(-1, 0, -2, 0, ENTITY_STATE_ENUM.BLOCKFRONT);
          case DIRECTION_ENUM.RIGHT:
            return checkBlockingConditions(-1, 0, 0, 0, ENTITY_STATE_ENUM.BLOCKBACK);
        }
        break;
      case CONTROLLER_ENUM.RIGHT:
        switch (direction) {
          case DIRECTION_ENUM.TOP:
            return checkBlockingConditions(1, 0, 1, -1, ENTITY_STATE_ENUM.BLOCKRIGHT);
          case DIRECTION_ENUM.BOTTOM:
            return checkBlockingConditions(1, 0, 1, 1, ENTITY_STATE_ENUM.BLOCKLEFT);
          case DIRECTION_ENUM.LEFT:
            return checkBlockingConditions(1, 0, 0, 0, ENTITY_STATE_ENUM.BLOCKFRONT);
          case DIRECTION_ENUM.RIGHT:
            return checkBlockingConditions(1, 0, 2, 0, ENTITY_STATE_ENUM.BLOCKBACK);
        }
        break;
      case CONTROLLER_ENUM.TURNLEFT:
        switch (direction) {
          case DIRECTION_ENUM.TOP:
            return checkTurnBlockigConditions(-1, -1, ENTITY_STATE_ENUM.BLOCKLEFT);
          case DIRECTION_ENUM.BOTTOM:
            return checkTurnBlockigConditions(1, 1, ENTITY_STATE_ENUM.BLOCKLEFT);
          case DIRECTION_ENUM.LEFT:
            return checkTurnBlockigConditions(-1, 1, ENTITY_STATE_ENUM.BLOCKLEFT);
          case DIRECTION_ENUM.RIGHT:
            return checkTurnBlockigConditions(1, -1, ENTITY_STATE_ENUM.BLOCKLEFT);
        }
        break;
      case CONTROLLER_ENUM.TURNRIGHT:
        switch (direction) {
          case DIRECTION_ENUM.TOP:
            return checkTurnBlockigConditions(1, -1, ENTITY_STATE_ENUM.BLOCKRIGHT);
          case DIRECTION_ENUM.BOTTOM:
            return checkTurnBlockigConditions(-1, 1, ENTITY_STATE_ENUM.BLOCKRIGHT);
          case DIRECTION_ENUM.LEFT:
            return checkTurnBlockigConditions(-1, -1, ENTITY_STATE_ENUM.BLOCKRIGHT);
          case DIRECTION_ENUM.RIGHT:
            return checkTurnBlockigConditions(1, 1, ENTITY_STATE_ENUM.BLOCKRIGHT);
        }
        break;
    }

    return false;
  }

  move(inputDirection: CONTROLLER_ENUM) {
    switch (inputDirection) {
      case CONTROLLER_ENUM.TOP:
        this.targetY -= 1;
        this.isMoving = true;
        this.showSmoke(DIRECTION_ENUM.TOP);
        break;
      case CONTROLLER_ENUM.BOTTOM:
        this.targetY += 1;
        this.isMoving = true;
        this.showSmoke(DIRECTION_ENUM.BOTTOM);
        break;
      case CONTROLLER_ENUM.LEFT:
        this.targetX -= 1;
        this.isMoving = true;
        this.showSmoke(DIRECTION_ENUM.LEFT);
        break;
      case CONTROLLER_ENUM.RIGHT:
        this.targetX += 1;
        this.isMoving = true;
        this.showSmoke(DIRECTION_ENUM.RIGHT);
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
        this.state = ENTITY_STATE_ENUM.TURNLEFT; // 先完成内部状体改变，再触发外部事件改变下一个状态
        EventManager.Instance.emit(EVENT_ENUM.PLAYER_MOVE_END);
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
        EventManager.Instance.emit(EVENT_ENUM.PLAYER_MOVE_END);
        break;
    }
    // console.log(this.targetX, this.targetY, this.x, this.y);
  }

  showSmoke(direction: DIRECTION_ENUM) {
    EventManager.Instance.emit(EVENT_ENUM.SHOW_SMOKE, this.x, this.y, direction);
  }
}
