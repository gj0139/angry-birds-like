# 类愤怒的小鸟（网页版）Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个可玩的网页版类愤怒的小鸟游戏：弹弓发射小鸟、撞塌木/石/冰结构、消灭全部猪过关，含 3 关、星级与进度存档。

**Architecture:** 原生 JS ES 模块 + Vite；Matter.js 负责 2D 刚体模拟，游戏逻辑（弹弓数学、伤害、状态机、进度）全部写成可单测的纯函数/无 DOM 模块；Canvas 渲染器读取刚体状态画几何色块；DOM 承担菜单/HUD/结算浮层。数据流：input → game（接线、固定步长循环、碰撞→伤害入队）→ gameState reducer → ui/render。

**Tech Stack:** vanilla JS (ESM)、Vite、Vitest、matter-js、WebAudio（合成音效，无素材文件）

**Spec:** docs/superpowers/specs/2026-09-29-angry-birds-like.md（所有精确数值以 spec 为准）

## Global Constraints

- 世界逻辑坐标固定 1600×900；画布信箱式等比缩放，相机不滚动。
- 无外部图片/音频素材：美术全部 Canvas 绘制，音效全部 WebAudio 合成。
- 不做触屏适配、不做多鸟种、不做轨迹预测线（第一版范围）。
- 测试命令统一：`npm test <文件路径>`（package.json 中 `"test": "vitest run"`）。
- 提交信息用 conventional commits（`feat:` / `test:` / `chore:`）。
- 每个任务完成后提交一次；工作目录不是 git 仓库时先 `git init`。

## Review Focus

以下输入/失败模式没有单独任务天然覆盖，各挂在对应任务上用测试钉死：

1. **拉拽越界与过小拉伸**：指针拉出 maxPull 外、或拉伸 <10px 松手 —— 期望分别被钳制、不发射。→ Task 2 `test_clamp_pull` / `test_no_launch_below_min`。
2. **碰撞回调中直接移除刚体导致 Matter 崩溃/迭代异常** —— 期望伤害入队、Engine.update 返回后再移除。→ Task 9 `test_block_destroyed_after_step_not_during`。
3. **结算竞态**：猪在结算窗口内刚死、或结构永不静止 —— 期望结算时刻判定胜负且 6s 超时强制结算。→ Task 6 `test_win_when_last_pig_dies_before_settled` / `test_force_settle_on_timeout`。
4. **进度存储不可用或数据损坏**：localStorage 抛异常/存了非法星数 —— 期望降级内存、非法值归 0。→ Task 10 `test_progress_survives_storage_error` / `test_corrupt_stars_reset_to_zero`。
5. **信箱缩放后坐标错位**：绘制变换与鼠标 world 坐标互逆 —— 期望 roundtrip 恒等。→ Task 7 `test_viewport_roundtrip`。

---

### Task 1: 项目脚手架 + 物理世界冒烟

**Files:**
- Create: `package.json`, `vite.config.js`, `index.html`, `src/physics.js`, `tests/physics.test.js`
- Modify: 无

**Interfaces:**
- Consumes: 无
- Produces:
  - `createWorld() → { engine, world }`（gravity.y = 1，不自动渲染）
  - `step(engine, delta = 1000/60) → void`
  - `addGround(engine, { width, height }) → Matter.Body`（static，顶面在 y = height）
  - npm scripts：`dev`（vite）、`test`（vitest run）、`build`（vite build）

- [ ] **Step 1: 初始化仓库与依赖**

```bash
git init
npm init -y
npm install matter-js
npm install -D vite vitest
```

在 `package.json` scripts 中设：`"dev": "vite"`, `"build": "vite build"`, `"test": "vitest run"`。

- [ ] **Step 2: 写失败测试 `tests/physics.test.js`**

```js
import { describe, it, expect } from 'vitest';
import { createWorld, step, addGround } from '../src/physics.js';

describe('physics', () => {
  it('gravity pulls a body downward over steps', () => {
    const { engine } = createWorld();
    const { Bodies } = await import('matter-js');
    const box = Bodies.rectangle(800, 100, 40, 40);
    Matter.Composite.add(engine.world, box);
    const y0 = box.position.y;
    for (let i = 0; i < 30; i++) step(engine);
    expect(box.position.y).toBeGreaterThan(y0 + 50);
  });
  it('ground stops a falling body', async () => {
    const { engine } = createWorld();
    const { Bodies } = await import('matter-js');
    addGround(engine, { width: 1600, height: 800 });
    const box = Bodies.rectangle(800, 100, 40, 40);
    Matter.Composite.add(engine.world, box);
    for (let i = 0; i < 600; i++) step(engine);
    expect(box.position.y).toBeLessThan(800);
    expect(box.position.y).toBeGreaterThan(740);
  });
});
```

（测试内改为顶层 `import Matter from 'matter-js'`，上述 `await import` 仅示意——实现时用静态 import 写法。）

- [ ] **Step 3: 运行测试确认失败**

Run: `npm test tests/physics.test.js`
Expected: FAIL（`src/physics.js` 不存在）

- [ ] **Step 4: 实现 `src/physics.js`**

`createWorld` 用 `Matter.Engine.create()`，`engine.gravity.y = 1`；`step` 调 `Matter.Engine.update(engine, delta)`；`addGround` 建 static 矩形，中心 y = height + 50、高 100，使顶面恰为 `height`。

- [ ] **Step 5: 运行测试确认通过**

Run: `npm test tests/physics.test.js`
Expected: PASS

- [ ] **Step 6: 最小 `index.html` + `vite.config.js`**

`index.html` 含 `<canvas id="game" width="1600" height="900">` 和 `<script type="module" src="/src/main.js">`；`src/main.js` 先只做 `createWorld()` + `console.log`。`vite.config.js` 导出空配置即可（`defineConfig({})`）。手动验收：`npm run dev` 页面无报错。

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: scaffold vite+vitest project with physics smoke test"
```

---

### Task 2: 弹弓数学（纯函数）

**Files:**
- Create: `src/slingshot.js`, `tests/slingshot.test.js`

**Interfaces:**
- Consumes: spec 中 SLING 精确值（anchor (220,620)、maxPull 120、minPull 10、power 0.2、grabRadius 60）
- Produces:
  - `computePull(anchor, pointer, maxPull) → {x, y}`（pointer − anchor，长度钳制 ≤ maxPull）
  - `computeLaunchVelocity(pull, power) → {x, y}`（−pull × power）
  - `shouldLaunch(pull, minPull) → boolean`（长度 ≥ minPull）
  - `isWithinGrabRadius(point, birdPos, grabRadius) → boolean`

- [ ] **Step 1: 写失败测试 `tests/slingshot.test.js`**

```js
import { describe, it, expect } from 'vitest';
import { computePull, computeLaunchVelocity, shouldLaunch, isWithinGrabRadius } from '../src/slingshot.js';

const anchor = { x: 220, y: 620 };

describe('slingshot', () => {
  it('pull equals pointer minus anchor', () => {
    expect(computePull(anchor, { x: 320, y: 620 }, 120)).toEqual({ x: 100, y: 0 });
  });
  it('clamps pull length to maxPull', () => {
    const pull = computePull(anchor, { x: 520, y: 620 }, 120); // 拉伸 300
    expect(Math.hypot(pull.x, pull.y)).toBeCloseTo(120, 5);
    expect(pull.x).toBeCloseTo(120, 5);
    expect(pull.y).toBeCloseTo(0, 5);
  });
  it('launch velocity is reverse pull times power', () => {
    expect(computeLaunchVelocity({ x: 100, y: 0 }, 0.2)).toEqual({ x: -20, y: -0 });
  });
  it('no launch below min pull', () => {
    expect(shouldLaunch({ x: 3, y: 4 }, 10)).toBe(false);   // 长度 5
    expect(shouldLaunch({ x: 6, y: 8 }, 10)).toBe(true);    // 长度 10
  });
  it('grab radius check', () => {
    expect(isWithinGrabRadius({ x: 250, y: 620 }, anchor, 60)).toBe(true);
    expect(isWithinGrabRadius({ x: 400, y: 620 }, anchor, 60)).toBe(false);
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npm test tests/slingshot.test.js`
Expected: FAIL（模块不存在）

- [ ] **Step 3: 实现 `src/slingshot.js`**

四个纯函数；`computePull` 对钳制后的向量注意 `y: -0` 边界（测试用 `toEqual` 需与实现一致，允许调整测试期望为 `closeTo` 断言——若 `-0` 困扰，实现里用 `y: pull.y * 1` 归一）。spec 常量不写死在此模块，由调用方从 `src/config.js` 传入。

- [ ] **Step 4: 运行测试确认通过**

Run: `npm test tests/slingshot.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/slingshot.js tests/slingshot.test.js
git commit -m "feat: slingshot pull and launch math"
```

---

### Task 3: 材质表、方块与伤害模型

**Files:**
- Create: `src/config.js`, `src/materials.js`, `src/blocks.js`, `src/damage.js`, `tests/damage.test.js`

**Interfaces:**
- Consumes: Task 1 的 `createWorld/step`；spec 材质表与伤害公式
- Produces:
  - `src/config.js`：`WORLD`、`GROUND_Y: 800`、`SLING`、`SETTLE`、`PIG`、`BIRD` 常量对象（精确值见 spec；地面顶面恒为 GROUND_Y=800，与 WORLD.height=900 无关）
  - `MATERIALS`：`{ wood, stone, ice }`，每项 `{ density, friction, hp, fill, stroke }`
  - `createBlock(engine, { x, y, w, h, material }) → Matter.Body`，`body.plugin = { kind: 'block', material, hp, maxHp }`
  - `applyImpact(targetBody, impactSpeed, { byBird }) → boolean`（返回是否被摧毁；原地扣 HP，<1 的冲击忽略）
  - `isDestroyed(body) → boolean`

- [ ] **Step 1: 写失败测试 `tests/damage.test.js`**

```js
import { describe, it, expect } from 'vitest';
import { createWorld, step } from '../src/physics.js';
import { MATERIALS } from '../src/materials.js';
import { createBlock, applyImpact, isDestroyed } from '../src/blocks.js';
import { applyImpactDamage } from '../src/damage.js';

describe('materials & damage', () => {
  it('material table matches spec', () => {
    expect(MATERIALS.wood).toMatchObject({ density: 0.001, friction: 0.6, hp: 6 });
    expect(MATERIALS.stone).toMatchObject({ density: 0.004, friction: 0.8, hp: 14 });
    expect(MATERIALS.ice).toMatchObject({ density: 0.0008, friction: 0.2, hp: 3 });
  });
  it('block carries hp from its material', () => {
    const { engine } = createWorld();
    const b = createBlock(engine, { x: 800, y: 700, w: 80, h: 40, material: 'wood' });
    expect(b.plugin.hp).toBe(6);
    expect(b.plugin.kind).toBe('block');
  });
  it('impact below 1 does nothing', () => {
    const { engine } = createWorld();
    const b = createBlock(engine, { x: 0, y: 0, w: 40, h: 40, material: 'wood' });
    expect(applyImpact(b, 0.5, { byBird: false })).toBe(false);
    expect(b.plugin.hp).toBe(6);
  });
  it('bird impact doubles damage: speed 4 destroys wood (4*2=8>=6)', () => {
    const { engine } = createWorld();
    const b = createBlock(engine, { x: 0, y: 0, w: 40, h: 40, material: 'wood' });
    expect(applyImpact(b, 4, { byBird: true })).toBe(true);
    expect(isDestroyed(b)).toBe(true);
  });
  it('non-bird impact: stone survives speed 3, dies to cumulative hits', () => {
    const { engine } = createWorld();
    const s = createBlock(engine, { x: 0, y: 0, w: 40, h: 40, material: 'stone' });
    expect(applyImpact(s, 3, { byBird: false })).toBe(false); // hp 14→11
    expect(s.plugin.hp).toBe(11);
    for (let i = 0; i < 4; i++) applyImpact(s, 3, { byBird: false }); // −12 → −1
    expect(isDestroyed(s)).toBe(true);
  });
});
```

（`applyImpactDamage` 若不单独导出则从测试中删去——damage 公式统一放 `damage.js`，`blocks.js` 的 `applyImpact` 只是带 byBird 参数的入口；实现时二者合一即可，测试以实际导出为准，但公式与数值必须与上表一致。）

- [ ] **Step 2: 运行测试确认失败**

Run: `npm test tests/damage.test.js`
Expected: FAIL

- [ ] **Step 3: 实现 `src/config.js`、`src/materials.js`、`src/blocks.js`、`src/damage.js`**

- `config.js`：按 spec「玩法规格」抄录常量（WORLD、SLING、SETTLE、PIG、BIRD）。
- `blocks.js`：`Matter.Bodies.rectangle(x, y, w, h, { density, friction, restitution: 0.1 })`，`plugin` 挂 HP。
- `damage.js`：`damage = impactSpeed * (byBird ? 2 : 1)`；`impactSpeed < 1` 直接返回 false；扣血后 `hp ≤ 0` 置 `plugin.destroyed = true` 并返回 true。**不在此处调用 `Composite.remove`**（由 Task 9 统一在 update 后处理）。

- [ ] **Step 4: 运行测试确认通过**

Run: `npm test tests/damage.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/config.js src/materials.js src/blocks.js src/damage.js tests/damage.test.js
git commit -m "feat: material table and impact damage model"
```

---

### Task 4: 猪与小鸟

**Files:**
- Create: `src/pig.js`, `src/bird.js`, `tests/creatures.test.js`

**Interfaces:**
- Consumes: Task 1 `createWorld`；Task 3 `config.js`（PIG/BIRD 常量）、`damage.js`
- Produces:
  - `createPig(engine, { x, y }) → Matter.Body`（circle r=22，`plugin = { kind:'pig', hp:10, maxHp:10, destroyed:false }`）
  - `applyPigImpact(pigBody, impactSpeed, { byBird }) → boolean`（≥8 立即死亡；否则复用通用扣血；死亡置 destroyed 并返回 true）
  - `createBird(engine, anchor) → Matter.Body`（circle r=18，density 0.005，`isStatic = true`，`plugin = { kind:'bird' }`，位置在 anchor）
  - `launchBird(engine, bird, velocity) → void`（`setStatic(false)` + `setVelocity(velocity)`）

- [ ] **Step 1: 写失败测试 `tests/creatures.test.js`**

```js
import { describe, it, expect } from 'vitest';
import { createWorld, step } from '../src/physics.js';
import { createPig, applyPigImpact } from '../src/pig.js';
import { createBird, launchBird } from '../src/bird.js';

describe('pig', () => {
  it('has spec hp and dies instantly at impact speed >= 8', () => {
    const { engine } = createWorld();
    const pig = createPig(engine, { x: 900, y: 700 });
    expect(pig.plugin.hp).toBe(10);
    expect(applyPigImpact(pig, 7.9, { byBird: true })).toBe(false);
    expect(applyPigImpact(pig, 8, { byBird: false })).toBe(true);
    expect(pig.plugin.destroyed).toBe(true);
  });
  it('dies from accumulated non-lethal damage', () => {
    const { engine } = createWorld();
    const pig = createPig(engine, { x: 900, y: 700 });
    // 5 * 2 (byBird) = 10 → hp 0
    expect(applyPigImpact(pig, 5, { byBird: true })).toBe(true);
  });
});

describe('bird', () => {
  it('starts static on the anchor and launches with given velocity', () => {
    const { engine } = createWorld();
    const bird = createBird(engine, { x: 220, y: 620 });
    expect(bird.isStatic).toBe(true);
    expect(bird.position).toMatchObject({ x: 220, y: 620 });
    launchBird(engine, bird, { x: -20, y: -10 });
    expect(bird.isStatic).toBe(false);
    for (let i = 0; i < 10; i++) step(engine);
    expect(bird.position.x).toBeLessThan(220); // 向左飞出
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npm test tests/creatures.test.js`
Expected: FAIL

- [ ] **Step 3: 实现 `src/pig.js`、`src/bird.js`**

猪的致命阈值 8 来自 `config.PIG.impactKillSpeed`；非致命路径复用 `damage.js` 的扣血函数。小鸟 `launchBird` 里先 `Matter.Body.setStatic(bird, false)` 再 `Matter.Body.setVelocity(bird, velocity)`（顺序不能反）。

- [ ] **Step 4: 运行测试确认通过**

Run: `npm test tests/creatures.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/pig.js src/bird.js tests/creatures.test.js
git commit -m "feat: pig and bird bodies with launch"
```

---

### Task 5: 关卡配置与加载器

**Files:**
- Create: `src/levelLoader.js`, `tests/levelLoader.test.js`
- Modify: 无（关卡数据本体在 Task 11）

**Interfaces:**
- Consumes: Task 1 `addGround`；Task 3/4 的 create* 工厂
- Produces:
  - 关卡配置形状（Task 11 照此写数据）：

```js
/** @typedef {{ x:number, y:number, w:number, h:number, material:'wood'|'stone'|'ice' }} BlockCfg */
/** @typedef {{ x:number, y:number }} PigCfg */
/** @typedef {{ birds:number, blocks:BlockCfg[], pigs:PigCfg[] }} LevelCfg */
```

  - `loadLevel(engine, cfg) → { blocks: Body[], pigs: Body[], birdsRemaining: number, ground: Body }`

- [ ] **Step 1: 写失败测试 `tests/levelLoader.test.js`**

```js
import { describe, it, expect } from 'vitest';
import { createWorld } from '../src/physics.js';
import { loadLevel } from '../src/levelLoader.js';

const cfg = {
  birds: 3,
  blocks: [
    { x: 900, y: 760, w: 100, h: 40, material: 'wood' },
    { x: 900, y: 700, w: 40, h: 80, material: 'stone' },
    { x: 1000, y: 760, w: 60, h: 60, material: 'ice' },
  ],
  pigs: [{ x: 950, y: 740 }],
};

describe('levelLoader', () => {
  it('builds bodies from config', () => {
    const { engine } = createWorld();
    const level = loadLevel(engine, cfg);
    expect(level.blocks).toHaveLength(3);
    expect(level.pigs).toHaveLength(1);
    expect(level.birdsRemaining).toBe(3);
    expect(level.blocks[0].plugin.material).toBe('wood');
    expect(level.blocks[1].plugin.hp).toBe(14);
    expect(level.ground.isStatic).toBe(true);
  });
  it('rejects unknown material', () => {
    const { engine } = createWorld();
    expect(() => loadLevel(engine, {
      birds: 1, blocks: [{ x: 0, y: 0, w: 10, h: 10, material: 'diamond' }], pigs: [],
    })).toThrow(/material/i);
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npm test tests/levelLoader.test.js`
Expected: FAIL

- [ ] **Step 3: 实现 `src/levelLoader.js`**

先 `addGround(engine, { width: WORLD.width, height: GROUND_Y })`（顶面 y=800），再逐条创建 block/pig；material 不在 `MATERIALS` 里时 `throw new Error('unknown material: ...')`。不负责摄像/UI。

- [ ] **Step 4: 运行测试确认通过**

Run: `npm test tests/levelLoader.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/levelLoader.js tests/levelLoader.test.js
git commit -m "feat: level config loader"
```

---

### Task 6: 游戏状态机（胜负/星级/装填）

**Files:**
- Create: `src/gameState.js`, `tests/gameState.test.js`

**Interfaces:**
- Consumes: spec 状态机与星级公式（无运行时依赖，纯函数）
- Produces:
  - `createGame(birdsRemaining, pigsRemaining) → state`：`{ phase:'aiming', birdsRemaining, pigsRemaining, stars:0, launchAt:null }`
  - `reduce(state, event) → state`（不可变，返回新对象）
  - 事件：
    - `{ type:'DRAG_START' }`：仅 aiming → dragging
    - `{ type:'DRAG_CANCEL' }`：仅 dragging → aiming
    - `{ type:'LAUNCH' }`：仅 dragging → flying，`birdsRemaining −1`，记 `launchAt = event.now`（毫秒时间戳）
    - `{ type:'PIG_DIED' }`：`pigsRemaining −1`（下限 0；任何 phase 都接受）
    - `{ type:'SETTLED' }`：仅 flying → 判定：`pigsRemaining===0` → won（`stars = min(birdsRemaining + 1, 3)`）；否则 `birdsRemaining===0` → lost；否则 → aiming
    - `{ type:'RESTART', birds, pigs }` → 全新 `createGame` 结果
  - 非法 phase 下的事件：原样返回 state（幂等，不抛错）

- [ ] **Step 1: 写失败测试 `tests/gameState.test.js`**

```js
import { describe, it, expect } from 'vitest';
import { createGame, reduce } from '../src/gameState.js';

const chain = (state, ...events) => events.reduce(reduce, state);

describe('gameState', () => {
  it('happy path: aiming → dragging → flying → won with 3 stars', () => {
    let s = createGame(3, 2);                 // 关卡 3 鸟 2 猪
    s = reduce(s, { type: 'DRAG_START' });
    expect(s.phase).toBe('dragging');
    s = reduce(s, { type: 'LAUNCH', now: 1000 }); // 用掉 1 鸟，剩 2
    expect(s).toMatchObject({ phase: 'flying', birdsRemaining: 2 });
    s = reduce(s, { type: 'PIG_DIED' });
    s = reduce(s, { type: 'PIG_DIED' });
    s = reduce(s, { type: 'SETTLED' });
    expect(s.phase).toBe('won');
    expect(s.stars).toBe(3);                  // min(2+1, 3)
  });
  it('lose when birds run out and pigs remain', () => {
    let s = createGame(1, 1);
    s = chain(s, { type: 'DRAG_START' }, { type: 'LAUNCH', now: 0 }, { type: 'SETTLED' });
    expect(s.phase).toBe('lost');
  });
  it('reload next bird when pigs survive', () => {
    let s = createGame(3, 1);
    s = chain(s, { type: 'DRAG_START' }, { type: 'LAUNCH', now: 0 }, { type: 'SETTLED' });
    expect(s.phase).toBe('aiming');
    expect(s.birdsRemaining).toBe(2);
    expect(s.pigsRemaining).toBe(1);
  });
  it('win when last pig dies before settle check', () => {
    let s = createGame(2, 1);
    s = chain(s, { type: 'DRAG_START' }, { type: 'LAUNCH', now: 0 }, { type: 'PIG_DIED' }, { type: 'SETTLED' });
    expect(s.phase).toBe('won');
    expect(s.stars).toBe(2);                  // min(1+1, 3)
  });
  it('stars bottom out at 1', () => {
    let s = createGame(1, 1);
    s = chain(s, { type: 'DRAG_START' }, { type: 'LAUNCH', now: 0 }, { type: 'PIG_DIED' }, { type: 'SETTLED' });
    expect(s.stars).toBe(1);
  });
  it('events in wrong phase are ignored', () => {
    const s = createGame(3, 1);
    expect(reduce(s, { type: 'LAUNCH', now: 0 })).toEqual(s);      // aiming 时不能发射
    expect(reduce(s, { type: 'SETTLED' })).toEqual(s);             // 非 flying 不结算
    const d = reduce(s, { type: 'DRAG_START' });
    expect(reduce(d, { type: 'DRAG_START' }).phase).toBe('dragging'); // 幂等不炸
  });
  it('drag cancel returns to aiming', () => {
    let s = createGame(3, 1);
    s = chain(s, { type: 'DRAG_START' }, { type: 'DRAG_CANCEL' });
    expect(s.phase).toBe('aiming');
    expect(s.birdsRemaining).toBe(3);
  });
  it('RESTART resets everything', () => {
    let s = createGame(1, 2);
    s = chain(s, { type: 'DRAG_START' }, { type: 'LAUNCH', now: 0 }, { type: 'PIG_DIED' }, { type: 'SETTLED' }, { type: 'RESTART', birds: 1, pigs: 2 });
    expect(s).toMatchObject({ phase: 'aiming', birdsRemaining: 1, pigsRemaining: 2, stars: 0 });
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npm test tests/gameState.test.js`
Expected: FAIL

- [ ] **Step 3: 实现 `src/gameState.js`**

纯 reducer：switch(event.type) + phase 守卫；所有分支返回新对象，禁止改入参。`won` 的 `stars` 只在进入 won 时算一次。

- [ ] **Step 4: 运行测试确认通过**

Run: `npm test tests/gameState.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/gameState.js tests/gameState.test.js
git commit -m "feat: game state reducer with win/lose and stars"
```

---

### Task 7: 视口与渲染器

**Files:**
- Create: `src/render.js`, `tests/render.test.js`

**Interfaces:**
- Consumes: spec 信箱缩放规则；Matter body 的 duck-typing 形状（`position {x,y}`、`angle`、`plugin`）
- Produces:
  - `computeViewport(worldW, worldH, canvasW, canvasH) → { scale, offsetX, offsetY }`（scale = min(canvasW/worldW, canvasH/worldH)，offset 居中）
  - `toWorld(point, vp) → { x, y }`（`((p − offset) / scale)`），`toScreen(point, vp) → { x, y }`（逆变换）
  - `createRenderer(canvas) → { resize(), draw(scene), toWorld(point), toScreen(point) }`
    - `resize()`：按 devicePixelRatio 设 canvas.width/height，内部存 `computeViewport(1600, 900, cssW, cssH)`；`toWorld/toScreen` 委托内部 viewport（Task 9 的 input 直接用它，保证与绘制同一变换）
    - `draw(scene)`：scene = `{ slingAnchor, stretch: {x,y}|null, bird: Body|null, blocks: Body[], pigs: Body[], groundY }`
    - 绘制顺序：天空底色 → 地面条 → 弹弓后叉 + 拉伸皮筋 → blocks（`translate/rotate` + fillRect + stroke，颜色取 `MATERIALS[plugin.material]`）→ pigs（绿色圆 + 眼睛两白点 + 血条）→ bird（红色圆 + 白眼）→ 弹弓前叉

- [ ] **Step 1: 写失败测试 `tests/render.test.js`**

```js
import { describe, it, expect } from 'vitest';
import { computeViewport, toWorld, toScreen, createRenderer } from '../src/render.js';

describe('viewport', () => {
  it('letterboxes 1600x900 into a wider canvas', () => {
    const vp = computeViewport(1600, 900, 2000, 900);
    expect(vp.scale).toBeCloseTo(1, 5);          // 高度撑满
    expect(vp.offsetX).toBeCloseTo(200, 5);      // 左右各 200
    expect(vp.offsetY).toBeCloseTo(0, 5);
  });
  it('roundtrip screen↔world', () => {
    const vp = computeViewport(1600, 900, 1200, 700);
    const world = { x: 220, y: 620 };
    const back = toWorld(toScreen(world, vp), vp);
    expect(back.x).toBeCloseTo(world.x, 5);
    expect(back.y).toBeCloseTo(world.y, 5);
  });
});

describe('renderer', () => {
  it('draws every entity without throwing, using a mock ctx', () => {
    const calls = [];
    const ctx = new Proxy({}, {
      get: (_, prop) => {
        if (prop === 'canvas') return { width: 1200, height: 700 };
        return (...args) => calls.push([prop, ...args]);
      },
      set: () => true,
    });
    const r = createRenderer({ width: 1200, height: 700, getContext: () => ctx, style: {} });
    r.resize();
    r.draw({
      slingAnchor: { x: 220, y: 620 },
      stretch: { x: 60, y: 20 },
      bird: { position: { x: 220, y: 620 }, angle: 0, plugin: { kind: 'bird' } },
      blocks: [{ position: { x: 900, y: 760 }, angle: 0.1, plugin: { kind: 'block', material: 'wood', hp: 4, maxHp: 6 } }],
      pigs: [{ position: { x: 950, y: 740 }, angle: 0, plugin: { kind: 'pig', hp: 6, maxHp: 10 } }],
      groundY: 800,
    });
    expect(calls.length).toBeGreaterThan(10);
    expect(calls.some(([m]) => m === 'arc')).toBe(true);   // 画了圆（猪/鸟）
    expect(calls.some(([m]) => m === 'fillRect')).toBe(true); // 画了方块/地面
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npm test tests/render.test.js`
Expected: FAIL

- [ ] **Step 3: 实现 `src/render.js`**

`draw` 开头 `ctx.setTransform(scale, 0, 0, scale, offsetX, offsetY)` 把后续绘制全部放进世界坐标；结束时 `setTransform(1,0,0,1,0,0)`。颜色一律从 `MATERIALS` 表读，猪绿 `#7CB342`、鸟红 `#E53935` 写成模块内常量。`createRenderer` 接收 canvas-like 对象（测试传 mock），真实 DOM 在 Task 9 接。

- [ ] **Step 4: 运行测试确认通过**

Run: `npm test tests/render.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/render.js tests/render.test.js
git commit -m "feat: letterbox viewport and geometric renderer"
```

---

### Task 8: 音效模块（WebAudio 合成）

**Files:**
- Create: `src/audio.js`, `tests/audio.test.js`

**Interfaces:**
- Consumes: spec 音效清单
- Produces:
  - `createSfx() → { play(name), setMuted(b), isMuted() }`
  - `name ∈ 'launch'|'impact'|'pigDie'|'win'|'lose'`；未知 name 静默忽略
  - 首次 `play` 时才创建 `AudioContext`（浏览器自动播放策略）；环境无 `AudioContext` 时 `play` 不抛错
  - `setMuted(true)` 后 `play` 不发声（状态可查）

- [ ] **Step 1: 写失败测试 `tests/audio.test.js`**

```js
import { describe, it, expect } from 'vitest';
import { createSfx } from '../src/audio.js';

describe('sfx', () => {
  it('starts unmuted and toggles', () => {
    const sfx = createSfx();
    expect(sfx.isMuted()).toBe(false);
    sfx.setMuted(true);
    expect(sfx.isMuted()).toBe(true);
  });
  it('play does not throw without AudioContext (node env)', () => {
    const sfx = createSfx();
    expect(() => sfx.play('launch')).not.toThrow();
    expect(() => sfx.play('nope')).not.toThrow(); // 未知音名静默
  });
  it('play does not throw while muted', () => {
    const sfx = createSfx();
    sfx.setMuted(true);
    expect(() => sfx.play('impact')).not.toThrow();
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npm test tests/audio.test.js`
Expected: FAIL

- [ ] **Step 3: 实现 `src/audio.js`**

每个音名一组 OscillatorNode 参数（launch 上滑音 impact 短噪声方波、pigDie 下滑、win 三连音、lose 低音下行——频率/时长实现自定，不进测试）。`globalThis.AudioContext || globalThis.webkitAudioContext` 取不到则内部 ctx 保持 null。

- [ ] **Step 4: 运行测试确认通过**

Run: `npm test tests/audio.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/audio.js tests/audio.test.js
git commit -m "feat: webaudio synthesized sfx with mute"
```

---

### Task 9: 游戏主体接线（循环/输入/碰撞→伤害/结算）

**Files:**
- Create: `src/game.js`, `src/input.js`, `tests/game.test.js`
- Modify: `src/main.js`

**Interfaces:**
- Consumes: 前 8 个任务的全部 Produces；`loadLevel(engine, cfg)`
- Produces:
  - `createInput(canvas, toWorld, handlers) → { destroy() }`，handlers = `{ onDown(worldPt), onMove(worldPt), onUp(worldPt) }`；`toWorld` 由 `renderer.toWorld` 注入（Task 7）；监听 mousedown/mousemove/mouseup
  - `class Game`：
    - `constructor({ canvas, sfx, levelCfg, callbacks })`，callbacks = `{ onStateChange(state), onResult({ won, stars }) }`
    - `start()`：建 world → `loadLevel` → 装填第一只鸟（`createBird` static 在 anchor）→ 挂 `collisionStart` → 启动 rAF 循环
    - `restart()`：销毁旧 world，等价重新 `start()`
    - `destroy()`：cancelAnimationFrame + input.destroy + 事件解绑
  - 循环内职责：
    1. `step(engine)`（固定 1000/60）
    2. 处理**伤害队列**（collisionStart 只 push `{body, impactSpeed, byBird}`，循环体里逐个 `applyImpact/applyPigImpact`；摧毁的标记 `destroyed` 的刚体在本帧 update 之后 `Composite.remove`，猪死亡时向 reducer 发 `PIG_DIED` 并 `sfx.play('pigDie')`）
    3. 飞行中的鸟出界（x∉[−200,1800] 或 y>1100）→ remove 并按已结算处理
    4. 结算检测：`flying` phase 时，全场 dynamic body 速度 < `SETTLE.speedThreshold` 累计 ≥1.5s，或 `now − launchAt ≥ 6000` → dispatch `SETTLED`
    5. `SETTLED` 后若回到 aiming → `createBird` 装填下一只；若 won/lost → `callbacks.onResult` + `sfx.play`
  - 拖拽交互：`onDown` 在 aiming 且距当前鸟 ≤ grabRadius → dispatch DRAG_START，记录 pull；`onMove` 更新 pull（钳制在 render 的 stretch 场景里画）；`onUp` 若 `shouldLaunch` → `launchBird` + dispatch LAUNCH + `sfx.play('launch')`，否则 DRAG_CANCEL

- [ ] **Step 1: 写失败测试 `tests/game.test.js`（headless 碰撞集成）**

```js
import { describe, it, expect } from 'vitest';
import { createWorld, step } from '../src/physics.js';
import { createBlock } from '../src/blocks.js';
import { createPig, applyPigImpact } from '../src/pig.js';

// 本测试钉死 Review Focus #2：伤害在 update 之后才移除刚体
describe('collision damage integration', () => {
  it('fast block impact marks destruction without removing during step', () => {
    const { engine } = createWorld();
    const wall = createBlock(engine, { x: 800, y: 760, w: 40, h: 80, material: 'ice' });
    const { Bodies, Composite } = require('matter-js'); // 实现时改静态 import
    const bullet = Bodies.rectangle(700, 760, 30, 30, { density: 0.01 });
    Composite.add(engine.world, bullet);
    const queue = [];
    Matter.Events.on(engine, 'collisionStart', (ev) => {
      for (const p of ev.pairs) {
        const speed = Math.hypot(
          p.bodyA.velocity.x - p.bodyB.velocity.x,
          p.bodyA.velocity.y - p.bodyB.velocity.y,
        );
        for (const b of [p.bodyA, p.bodyB]) {
          if (b.plugin?.hp != null) queue.push({ body: b, speed, byBird: false });
        }
      }
    });
    Matter.Body.setVelocity(bullet, { x: 24, y: 0 });
    for (let i = 0; i < 30; i++) {
      step(engine);                       // update 中不移除
      for (const q of queue.splice(0)) {
        const dead = applyImpact(q.body, q.speed, { byBird: q.byBird });
        if (dead) Composite.remove(engine.world, q.body); // update 后移除
      }
    }
    expect(Composite.allBodies(engine.world)).not.toContain(wall);
  });
});
```

（测试是集成骨架，实现时把「queue + collisionStart + update 后 flush」抽成 `game.js` 内可测的小函数 `createDamageCollector(engine, { onPigDied, byBirdBody })` 导出并单测，测试改为直接驱动该 collector——保持断言意图不变：`step` 期间不 remove，flush 后 body 离场。）

- [ ] **Step 2: 运行测试确认失败**

Run: `npm test tests/game.test.js`
Expected: FAIL

- [ ] **Step 3: 实现 `src/game.js`（含 `createDamageCollector`）与 `src/input.js`**

- `createDamageCollector(engine, opts)`：`attach()` 挂 collisionStart；`flush()` 遍历队列调 apply* + remove；猪死回调 `opts.onPigDied()`。
- `Game`：rAF 循环里 `step → collector.flush → settle 检查 → reducer dispatch → 重建鸟 → callbacks`。bodies ↔ reducer 的桥：`PIG_DIED` 每只猪只发一次（`plugin.counted` 防重）。
- `input.js`：只做坐标换算与回调，不含游戏逻辑。

- [ ] **Step 4: 运行测试确认通过**

Run: `npm test tests/game.test.js`
Expected: PASS

- [ ] **Step 5: 改造 `src/main.js` 并手动验收**

`main.js`：创建 canvas、`createSfx()`、临时单关 `levelCfg`（直接内联 Task 5 测试用 cfg）、`new Game(...)`、`onStateChange/onResult` 先 `console.log`。

手动验收（`npm run dev`）：
- 可拖拽小鸟、松手飞出、抛物线合理（最大拉伸 120px 应能击中 x≈900 的结构）
- 撞击后方块破碎消失、猪死亡有反馈
- 鸟用尽且猪在 → console 输出 lost；猪死光 → won
- 6 秒不结算也会出结果（把鸟打飞到界外验证）

- [ ] **Step 6: Commit**

```bash
git add src/game.js src/input.js src/main.js tests/game.test.js
git commit -m "feat: game loop, input and collision damage wiring"
```

---

### Task 10: HUD、结算浮层、关卡选择与进度存档

**Files:**
- Create: `src/ui.js`, `src/progress.js`, `tests/progress.test.js`, `tests/ui.test.js`
- Modify: `index.html`, `src/main.js`

**Interfaces:**
- Consumes: Task 9 `Game` 的 `callbacks.onStateChange/onResult`、`restart()`
- Produces:
  - `loadProgress(storage) → { stars: number[] }`（长度 3，默认全 0；单项 `Number` 非法或 <0 或 >3 → 归 0）
  - `saveStars(storage, levelIndex, stars) → { stars: number[] }`（取 max，写回）
  - `isUnlocked(progress, levelIndex) → boolean`（0 关恒 true，其余看 `stars[i−1] ≥ 1`）
  - `totalStars(progress) → number`
  - storage key：`'ab-like-progress'`；`storage` 参数可注入，`getItem/setItem` 抛异常时降级为模块内 Map（不抛给调用方）
  - `createHud(root, handlers) → { renderTopBar({ birdsLeft, levelIndex }), showResult({ won, stars, hasNext }), showLevelSelect({ levels, stars, unlocked }), hideOverlays() }`，handlers = `{ onRestart, onNext, onSelectLevel }`
    - 全部 DOM 元素由 `ui.js` 用 `document.createElement` 建（index.html 只提供挂载点 `<div id="hud">`），按钮带 `data-testid`（`btn-restart` / `btn-next` / `btn-level-N`）便于测试与手测

- [ ] **Step 1: 写失败测试 `tests/progress.test.js`**

```js
import { describe, it, expect } from 'vitest';
import { loadProgress, saveStars, isUnlocked, totalStars } from '../src/progress.js';

const memStorage = () => {
  const m = new Map();
  return { getItem: k => m.has(k) ? m.get(k) : null, setItem: (k, v) => m.set(k, String(v)) };
};

describe('progress', () => {
  it('defaults to three zero-star levels', () => {
    expect(loadProgress(memStorage())).toEqual({ stars: [0, 0, 0] });
  });
  it('saves max stars per level', () => {
    let s = memStorage();
    s = saveStars(s, 0, 2);
    s = saveStars(s, 0, 1);   // 不降级
    expect(loadProgress(s).stars).toEqual([2, 0, 0]);
  });
  it('locks level until previous has a star', () => {
    const p = { stars: [0, 0, 0] };
    expect(isUnlocked(p, 0)).toBe(true);
    expect(isUnlocked(p, 1)).toBe(false);
    expect(isUnlocked({ stars: [1, 0, 0] }, 1)).toBe(true);
  });
  it('corrupt stars reset to zero', () => {
    const s = { getItem: () => '{"stars":[9,"x",-1]}', setItem: () => {} };
    expect(loadProgress(s)).toEqual({ stars: [0, 0, 0] });
  });
  it('survives storage error', () => {
    const boom = { getItem: () => { throw new Error('nope'); }, setItem: () => { throw new Error('nope'); } };
    expect(() => loadProgress(boom)).not.toThrow();
    expect(loadProgress(boom)).toEqual({ stars: [0, 0, 0] });
    expect(() => saveStars(boom, 0, 3)).not.toThrow();
  });
  it('totals stars', () => {
    expect(totalStars({ stars: [3, 1, 0] })).toBe(4);
  });
});
```

- [ ] **Step 2: 写失败测试 `tests/ui.test.js`（jsdom）**

```js
// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { createHud } from '../src/ui.js';

describe('hud', () => {
  it('result overlay wires restart and next', () => {
    const root = document.createElement('div');
    document.body.appendChild(root);
    const onRestart = vi.fn(), onNext = vi.fn();
    const hud = createHud(root, { onRestart, onNext, onSelectLevel: vi.fn() });
    hud.showResult({ won: true, stars: 2, hasNext: true });
    root.querySelector('[data-testid="btn-restart"]').click();
    expect(onRestart).toHaveBeenCalled();
    root.querySelector('[data-testid="btn-next"]').click();
    expect(onNext).toHaveBeenCalled();
    hud.hideOverlays();
    expect(root.querySelector('[data-testid="btn-next"]')).toBeNull();
  });
  it('level select renders locks', () => {
    const root = document.createElement('div');
    const hud = createHud(root, { onRestart: vi.fn(), onNext: vi.fn(), onSelectLevel: vi.fn() });
    hud.showLevelSelect({ levels: 3, stars: [2, 0, 0], unlocked: [true, true, false] });
    expect(root.querySelector('[data-testid="btn-level-0"]').disabled).toBe(false);
    expect(root.querySelector('[data-testid="btn-level-2"]').disabled).toBe(true);
    expect(root.querySelector('[data-testid="btn-level-0"]').textContent).toContain('★');
  });
});
```

- [ ] **Step 3: 运行测试确认失败**

Run: `npm test tests/progress.test.js tests/ui.test.js`
Expected: FAIL

- [ ] **Step 4: 实现 `src/progress.js`、`src/ui.js`，接线 `index.html` 与 `src/main.js`**

- `index.html` 加 `<div id="hud"></div>` 与基础 CSS（浮层绝对定位、按钮样式——简笔风格，纯色块按钮）。
- `main.js` 改为：启动 → `showLevelSelect`（读 `loadProgress(window.localStorage)`）→ 选关 → `new Game`；`onResult` 里 `saveStars` + `showResult`；`onNext` 进下一关（末关 → 回选关）；`onRestart` 调 `game.restart()` 后 `hideOverlays`。

- [ ] **Step 5: 运行测试确认通过**

Run: `npm test tests/progress.test.js tests/ui.test.js`
Expected: PASS

- [ ] **Step 6: 手动验收**

`npm run dev`：选关页 3 个关卡、锁态正确；赢 1 关后第 2 关解锁、星显示正确；刷新页面进度保留；重开/下一关按钮可用。

- [ ] **Step 7: Commit**

```bash
git add src/ui.js src/progress.js index.html src/main.js tests/progress.test.js tests/ui.test.js
git commit -m "feat: hud overlays, level select and star progress"
```

---

### Task 11: 三个关卡设计与平衡

**Files:**
- Create: `src/levels/level1.js`, `src/levels/level2.js`, `src/levels/level3.js`, `tests/levels.test.js`
- Modify: `src/main.js`（关卡列表改为从 levels 导入）

**Interfaces:**
- Consumes: Task 5 `LevelCfg` 形状；Task 10 关卡选择（3 关）
- Produces:
  - 每关默认导出 `LevelCfg`；`src/levels/index.js` 导出 `LEVELS = [level1, level2, level3]`
  - 设计约束：地面 y=800；结构 x∈[850,1350]；弹弓在 (220,620)；每关 3 鸟、1–3 猪；关 1 全木教学、关 2 木+冰+1 石、关 3 三材质混合高塔

- [ ] **Step 1: 写失败测试 `tests/levels.test.js`**

```js
import { describe, it, expect } from 'vitest';
import { LEVELS } from '../src/levels/index.js';
import { MATERIALS } from '../src/materials.js';
import { WORLD } from '../src/config.js';

describe('levels', () => {
  it('has exactly 3 levels, each 3 birds and 1-3 pigs', () => {
    expect(LEVELS).toHaveLength(3);
    for (const lv of LEVELS) {
      expect(lv.birds).toBe(3);
      expect(lv.pigs.length).toBeGreaterThanOrEqual(1);
      expect(lv.pigs.length).toBeLessThanOrEqual(3);
    }
  });
  it('all pieces sit on or above the ground and inside the world', () => {
    for (const lv of LEVELS) {
      for (const b of lv.blocks) {
        expect(b.material in MATERIALS).toBe(true);
        expect(b.y + b.h / 2).toBeLessThanOrEqual(800.5);   // 不埋地
        expect(b.x).toBeGreaterThan(850);
        expect(b.x).toBeLessThan(1350);
        expect(b.x - b.w / 2).toBeGreaterThan(0);
        expect(b.x + b.w / 2).toBeLessThan(WORLD.width);
      }
      for (const p of lv.pigs) {
        expect(p.y).toBeLessThan(800);
        expect(p.x).toBeGreaterThan(850);
      }
    }
  });
  it('difficulty ramps: later levels use more materials and pieces', () => {
    const mats = lv => new Set(lv.blocks.map(b => b.material));
    expect(mats(LEVELS[0])).toEqual(new Set(['wood']));
    expect(mats(LEVELS[1]).size).toBeGreaterThanOrEqual(2);
    expect(LEVELS[2].blocks.length).toBeGreaterThan(LEVELS[0].blocks.length);
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npm test tests/levels.test.js`
Expected: FAIL

- [ ] **Step 3: 设计三关并实现 `src/levels/*`**

- 关 1（教学）：一组「门字形」木架 + 1 只猪，2 层以内。
- 关 2：木框包冰块芯 + 石基座，2 只猪（一高一低）。
- 关 3：三层塔（石基、木柱、冰顶）+ 塔内塔外各 1 猪 + 侧翼 1 猪，共 3 只。
- 所有 y 以刚体中心表达，块贴地时 `y = 800 − h/2`。

- [ ] **Step 4: 运行测试确认通过**

Run: `npm test tests/levels.test.js`
Expected: PASS

- [ ] **Step 5: 全量测试 + 手动平衡验收**

Run: `npm test`
Expected: 全部 PASS

手动验收（`npm run dev`）：
- 关 1：正中央平射应能 1–2 星过关（不能必须满拉才过）
- 关 2：需要利用塌落连锁，全用 1 只鸟应 ≥2 星
- 关 3：3 只鸟刚好够用（0 星边界情况不存在，最差 1 星）
- 若手感不符：只调 `src/config.js` 的 `SLING.power` 与关卡数据，不改物理公式

- [ ] **Step 6: `npm run build` 验收 + Commit**

Run: `npm run build`
Expected: 构建成功，`dist/` 生成

```bash
git add src/levels tests/levels.test.js src/main.js
git commit -m "feat: three hand-tuned levels with difficulty ramp"
```

