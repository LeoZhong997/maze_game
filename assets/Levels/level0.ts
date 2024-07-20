import { IEntity, ILevel, ITile } from '.';
import {
  DIRECTION_ENUM,
  ENTITY_STATE_ENUM,
  ENTITY_TYPE_ENUM,
  ENTITY_TYPE_MAP_CHAR_ENUM,
  TILE_TYPE_ENUM,
  TILE_TYPE_MAP_SRC_ENUM,
} from '../Enums';

class DisjointSet {
  parent: number[];
  rank: number[];

  constructor(n: number) {
    // 初始状态是所有子区都不连通
    this.parent = Array.from({ length: n }, (_, i) => i); // [0, 1, 2, ..., n-1]
    this.rank = new Array(n).fill(0); // [0, 0, ...]
  }

  find(u: number): number {
    if (this.parent[u] !== u) {
      this.parent[u] = this.find(this.parent[u]);
    }
    return this.parent[u];
  }

  union(u: number, v: number): void {
    const rootU = this.find(u);
    const rootV = this.find(v);
    // console.log("union before", rootU, rootV, this.parent, this.rank);
    if (rootU !== rootV) {
      if (this.rank[rootU] > this.rank[rootV]) {
        this.parent[rootV] = rootU;
      } else if (this.rank[rootU] < this.rank[rootV]) {
        this.parent[rootU] = rootV;
      } else {
        this.parent[rootV] = rootU;
        this.rank[rootU] += 1;
      }
      // console.log("union after", rootU, rootV, this.parent, this.rank);
    }
  }
}

function kruskalMaze(mazeWidth: number, mazeHeight: number, pathWidth: number): string[][] {
  //   const mazeWidth = width * (pathWidth + 1) + 1;
  //   const mazeHeight = height * (pathWidth + 1) + 1;
  const maze = Array.from({ length: mazeHeight }, () => Array(mazeWidth).fill('#'));
  const width = Math.ceil((mazeWidth - 1) / (pathWidth + 1)); // 子区数量
  const height = Math.ceil((mazeHeight - 1) / (pathWidth + 1)); // 子区数量
  // console.log("maze", maze, width, height);

  // Initialize maze with walls
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      for (let dy = 0; dy < pathWidth; dy++) {
        for (let dx = 0; dx < pathWidth; dx++) {
          maze[y * (pathWidth + 1) + dy + 1][x * (pathWidth + 1) + dx + 1] = ' ';
        }
      }
    }
  }
  // console.log("maze", maze);

  // 能够让子区互相联通的边的所有情况
  const edges: [number, number, number, number][] = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (x < width - 1) {
        edges.push([x, y, x + 1, y]); // y相同
      }
      if (y < height - 1) {
        edges.push([x, y, x, y + 1]); // x相同
      }
    }
  }
  // console.log("edges", edges);
  edges.sort(() => Math.random() - 0.5); // [0.5, -0.5]
  // console.log("random edges", edges);

  const ds = new DisjointSet(width * height); // 子区的连通域

  // 遍历所有子区的边
  for (const [x1, y1, x2, y2] of edges) {
    const cell1 = y1 * width + x1; // 边的端点（子区）对应的编号
    const cell2 = y2 * width + x2;
    // console.log("🚀 ~ cell1-cell2:", cell1, cell2, [x1, y1, x2, y2]);

    if (ds.find(cell1) !== ds.find(cell2)) {
      // 如果两个子区不连通，则将两个子区连通
      ds.union(cell1, cell2);
      if (x1 === x2) {
        for (let dy = 0; dy < pathWidth; dy++) {
          // 打开墙壁
          maze[Math.max(y1, y2) * (pathWidth + 1)][x1 * (pathWidth + 1) + dy + 1] = ' ';
          // console.log(
          //   "🚀 ~ maze y-x:",
          //   Math.max(y1, y2) * (pathWidth + 1),
          //   x1 * (pathWidth + 1) + dy + 1
          // );
        }
      } else if (y1 === y2) {
        for (let dx = 0; dx < pathWidth; dx++) {
          maze[y1 * (pathWidth + 1) + dx + 1][Math.max(x1, x2) * (pathWidth + 1)] = ' ';
          // console.log(
          //   "🚀 ~ maze y-x:",
          //   y1 * (pathWidth + 1) + dx + 1,
          //   Math.max(x1, x2) * (pathWidth + 1)
          // );
        }
      }
    }
  }

  return maze;
}

function printMaze(maze: string[][]): void {
  for (const row of maze) {
    console.log(row.join(''));
  }
}

function FixMaze(maze: string[][], mazeWidth: number, mazeHeight: number, pathWidth: number): string[][] {
  const width = Math.ceil((mazeWidth - 1) / (pathWidth + 1)); // 子区数量
  const height = Math.ceil((mazeHeight - 1) / (pathWidth + 1)); // 子区数量
  // console.log('🚀FixMaze ~ mazeWidth - mazeHeight:', mazeWidth, mazeHeight);
  // console.log('🚀FixMaze ~ region width - height:', width, height);

  // 补齐墙壁
  for (let y = 0; y < mazeHeight; y++) {
    for (let x = 0; x < mazeWidth; x++) {
      if (y === 0 || y === mazeHeight - 1 || x === 0 || x === mazeWidth - 1) {
        maze[y][x] = '#';
      }
    }
  }

  // 设置出入口
  maze[mazeHeight - 1][1] = ENTITY_TYPE_MAP_CHAR_ENUM.PLAYER;
  maze[0][mazeWidth - 2] = ENTITY_TYPE_MAP_CHAR_ENUM.DOOR;

  /***
   * 设置实体
   * 1. 统计子区内的空格坐标
   * 2. 随机选择子区，在子区内随机选择空格位置，作为实体位置
   * 3. 随机选择实体类型，放置实体
   */
  const regionEmptyCells: [number, number][][] = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (y === height - 1 && x === 0) {
        // 左下角player子区不统计
      } else {
        // 统计子区内的空格坐标
        const emptyCells: [number, number][] = [];
        for (let dy = 1; dy <= pathWidth; dy++) {
          for (let dx = 1; dx <= pathWidth; dx++) {
            const targetY = y * (pathWidth + 1) + dy;
            const targetX = x * (pathWidth + 1) + dx;
            if (maze[targetY][targetX] === ' ') {
              emptyCells.push([targetY, targetX]);
            }
          }
        }
        regionEmptyCells.push(emptyCells);
      }
    }
  }
  // console.log("🚀 ~ regionEmptyCells:", regionEmptyCells);

  // 随机选择子区，在子区内随机选择空格位置，作为实体位置
  const entityType = [
    ENTITY_TYPE_MAP_CHAR_ENUM.SKELETON_WOODEN,
    ENTITY_TYPE_MAP_CHAR_ENUM.SKELETON_IRON,
    ENTITY_TYPE_MAP_CHAR_ENUM.BURST,
    ENTITY_TYPE_MAP_CHAR_ENUM.SPIKES_ONE,
    ENTITY_TYPE_MAP_CHAR_ENUM.SPIKES_TWO,
    ENTITY_TYPE_MAP_CHAR_ENUM.SPIKES_THREE,
    ENTITY_TYPE_MAP_CHAR_ENUM.SPIKES_FOUR,
  ];
  for (let i = 0; i < 10; i++) {
    const regionIndex = Math.floor(Math.random() * regionEmptyCells.length);
    const emptyCells = regionEmptyCells[regionIndex];
    const emptyCellIndex = Math.floor(Math.random() * emptyCells.length);
    const [y, x] = emptyCells[emptyCellIndex];
    maze[y][x] = entityType[Math.floor(Math.random() * entityType.length)];
  }

  // 补齐悬崖
  const cliffRow: string[] = Array(mazeWidth).fill('#');
  maze.push(cliffRow);
  return maze;
}

/***
 * 将maze数组转换为level对象
 */
function mazeToLevel(maze: string[][], mazeWidth: number, mazeHeight: number) {
  const mapInfo: ITile[][] = [];
  const level: ILevel = {
    mapInfo: [],
    player: null,
    enemies: [],
    spikes: [],
    bursts: [],
    door: null,
  };

  for (let x = 0; x < mazeWidth; x++) {
    const colTiles: ITile[] = [];
    for (let y = 0; y < mazeHeight; y++) {
      const tile: ITile = { src: null, type: null };
      if (maze[y][x] === '#') {
        if (y === 0 && x === 0) {
          tile.src = TILE_TYPE_MAP_SRC_ENUM.WALL_LEFT_TOP;
          tile.type = TILE_TYPE_ENUM.WALL_LEFT_TOP;
        } else if (y === 0 && x === mazeWidth - 1) {
          tile.src = TILE_TYPE_MAP_SRC_ENUM.WALL_RIGHT_TOP;
          tile.type = TILE_TYPE_ENUM.WALL_RIGHT_TOP;
        } else if (y === mazeHeight - 2 && x === 0) {
          tile.src = TILE_TYPE_MAP_SRC_ENUM.WALL_LEFT_BOTTOM;
          tile.type = TILE_TYPE_ENUM.WALL_LEFT_BOTTOM;
        } else if (y === mazeHeight - 2 && x === mazeWidth - 1) {
          tile.src = TILE_TYPE_MAP_SRC_ENUM.WALL_RIGHT_BOTTOM;
          tile.type = TILE_TYPE_ENUM.WALL_RIGHT_BOTTOM;
        } else {
          if (y === mazeHeight - 1) {
            if (x === 0) {
              tile.src = TILE_TYPE_MAP_SRC_ENUM.CLIFF_LEFT;
              tile.type = TILE_TYPE_ENUM.CLIFF_LEFT;
            } else if (x === mazeWidth - 1) {
              tile.src = TILE_TYPE_MAP_SRC_ENUM.CLIFF_RIGHT;
              tile.type = TILE_TYPE_ENUM.CLIFF_RIGHT;
            } else {
              tile.src = TILE_TYPE_MAP_SRC_ENUM.CLIFF_CENTER;
              tile.type = TILE_TYPE_ENUM.CLIFF_CENTER;
            }
          } else if (y === 0 || y === mazeHeight - 2) {
            tile.src = TILE_TYPE_MAP_SRC_ENUM.WALL_ROW;
            tile.type = TILE_TYPE_ENUM.WALL_ROW;
          } else {
            tile.src = TILE_TYPE_MAP_SRC_ENUM.WALL_COLUMN;
            tile.type = TILE_TYPE_ENUM.WALL_COLUMN;
          }
        }
      } else {
        tile.src = TILE_TYPE_MAP_SRC_ENUM.FLOOR;
        tile.type = TILE_TYPE_ENUM.FLOOR;

        if (maze[y][x] === ENTITY_TYPE_MAP_CHAR_ENUM.PLAYER) {
          level.player = {
            x: x,
            y: y,
            direction: DIRECTION_ENUM.TOP,
            state: ENTITY_STATE_ENUM.IDLE,
            type: ENTITY_TYPE_ENUM.PLAYER,
          };
        } else if (maze[y][x] === ENTITY_TYPE_MAP_CHAR_ENUM.DOOR) {
          level.door = {
            x: x,
            y: y,
            direction: DIRECTION_ENUM.BOTTOM,
            state: ENTITY_STATE_ENUM.IDLE,
            type: ENTITY_TYPE_ENUM.DOOR,
          };
        } else if (maze[y][x] === ENTITY_TYPE_MAP_CHAR_ENUM.SKELETON_WOODEN) {
          level.enemies.push({
            x: x,
            y: y,
            direction: DIRECTION_ENUM.TOP,
            state: ENTITY_STATE_ENUM.IDLE,
            type: ENTITY_TYPE_ENUM.SKELETON_WOODEN,
          });
        } else if (maze[y][x] === ENTITY_TYPE_MAP_CHAR_ENUM.SKELETON_IRON) {
          level.enemies.push({
            x: x,
            y: y,
            direction: DIRECTION_ENUM.TOP,
            state: ENTITY_STATE_ENUM.IDLE,
            type: ENTITY_TYPE_ENUM.SKELETON_IRON,
          });
        } else if (maze[y][x] === ENTITY_TYPE_MAP_CHAR_ENUM.BURST) {
          level.bursts.push({
            x: x,
            y: y,
            direction: DIRECTION_ENUM.TOP,
            state: ENTITY_STATE_ENUM.IDLE,
            type: ENTITY_TYPE_ENUM.BURST,
          });
          tile.src = null;
          tile.type = null;
        } else if (maze[y][x] === ENTITY_TYPE_MAP_CHAR_ENUM.SPIKES_ONE) {
          level.spikes.push({
            x: x,
            y: y,
            type: ENTITY_TYPE_ENUM.SPIKES_ONE,
            count: 0,
          });
        } else if (maze[y][x] === ENTITY_TYPE_MAP_CHAR_ENUM.SPIKES_TWO) {
          level.spikes.push({
            x: x,
            y: y,
            type: ENTITY_TYPE_ENUM.SPIKES_TWO,
            count: 0,
          });
        } else if (maze[y][x] === ENTITY_TYPE_MAP_CHAR_ENUM.SPIKES_THREE) {
          level.spikes.push({
            x: x,
            y: y,
            type: ENTITY_TYPE_ENUM.SPIKES_THREE,
            count: 0,
          });
        } else if (maze[y][x] === ENTITY_TYPE_MAP_CHAR_ENUM.SPIKES_FOUR) {
          level.spikes.push({
            x: x,
            y: y,
            type: ENTITY_TYPE_ENUM.SPIKES_FOUR,
            count: 0,
          });
        }
      }
      colTiles.push(tile);
    }
    mapInfo.push(colTiles);
  }
  // console.log(mapInfo);
  level.mapInfo = mapInfo;
  return level;
}

function generateLevel() {
  // 使用Kruskal算法生成迷宫并打印
  let width = 8;
  let height = 8;
  const pathWidth = 2;
  width = width + ((width - 1) % (pathWidth + 1));
  height = height + ((height - 1) % (pathWidth + 1));
  // console.log('width, height', width, height, pathWidth);
  const maze = kruskalMaze(width, height, pathWidth);
  // printMaze(maze);

  const newMaze = FixMaze(maze, width, height, pathWidth);
  // printMaze(newMaze);

  return mazeToLevel(newMaze, width, height + 1);
}

const level: ILevel = generateLevel();

export default level;
