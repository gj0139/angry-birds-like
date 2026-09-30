# 类愤怒的小鸟（网页版）规格说明

来源：/grilling 会话锁定决策，用户确认"按照推荐来"。

## 已锁定决策

1. **平台**：网页 HTML5 Canvas，原生 JS ES 模块，Vite 构建，Vitest 测试，Matter.js 2D 刚体物理。
2. **范围**：3 个关卡、单一鸟种、星级评分、重开/下一关/关卡选择、简单音效（WebAudio 合成，无素材文件）、localStorage 进度。
3. **破坏**：真实 2D 刚体物理 + 材质血量（木/石/冰的密度、摩擦、HP 不同），碰撞按冲击速度扣血，HP≤0 移除刚体。
4. **美术**：简笔几何平涂色块 + 描边，全部 Canvas 代码绘制，无外部素材、无图片文件。
5. **用途**：练手/手感验证；第一版只做 PC 鼠标操作，不做触屏适配。
6. **发射**：经典弹弓拖拽，无抛物线轨迹预测；拖拽时显示一条沿 `-拉伸` 的直线方向指示（箭头虚线）——皮筋叉尖几何与真实射出方向有 15–20° 视觉偏差，方向线以物理公式为准。

## 玩法规格（精确值）

- **世界**：1600×900 固定逻辑坐标；地面顶面 y=800（`GROUND_Y`）；画布按 `min(cw/1600, ch/900)` 等比缩放并居中（信箱式），相机不滚动。
- **弹弓**：锚点 (220, 620)；按下点距当前小鸟 ≤60px 进入拖拽；拉伸向量 = 指针 − 锚点，长度钳制 ≤120px；松开时发射速度 = −拉伸 × 0.2（Matter 速度单位 px/step，最大 24）；拉伸 <10px 不发射（保持 aiming）。
- **材质表**：

  | 材质 | density | friction | HP | 填充色 | 描边色 |
  |------|---------|----------|----|--------|--------|
  | wood | 0.001 | 0.6 | 6 | #C68642 | #8A5A2B |
  | stone | 0.004 | 0.8 | 14 | #9E9E9E | #616161 |
  | ice | 0.0008 | 0.2 | 3 | #B3E5FC | #81D4FA |

- **伤害模型**（只在 collisionStart 计算）：`冲击速度 = |vA − vB|`（二维模长）；冲击速度 <1 忽略。`伤害 = 冲击速度 × (碰撞涉及当前飞行小鸟 ? 2 : 1)`；`HP −= 伤害`，HP≤0 移除刚体。
- **猪**：半径 22、HP 10；冲击速度 ≥8 立即死亡，否则按通用伤害扣血，HP≤0 死亡。死亡时 `pigsRemaining −1`。
- **小鸟**：半径 18、density 0.005；装填时 static，发射时置 non-static 并 setVelocity。
- **结算**：全场动态刚体速度 <0.5 持续 1.5s，或距发射超时 6s 强制结算。
- **胜负**：结算时猪全灭 = 胜；猪仍在且未发射小鸟数 = 0 = 负；否则装填下一只回到 aiming。
- **星级**：`stars = min(未发射小鸟数 + 1, 3)`（未发射数 2/1/0 → 3/2/1 星）。
- **状态机**：`aiming → dragging → flying → settling → aiming | won | lost`；`RESTART` 从 won/lost 回到 aiming（重建关卡）。
- **进度**：localStorage key `ab-like-progress`，存每关最高星；关卡 1 默认解锁，后续关卡前一关 ≥1 星解锁；storage 异常时降级为内存对象。

## 音效（WebAudio 合成，无文件）

`launch / impact / pigDie / win / lose` 五个音；AudioContext 在首次用户手势后创建；提供静音开关（状态可测）。

## 参考项目（GitHub 调研，2026-09-29 经 GitHub 公开 API 检索）

- [liabru/matter-js](https://github.com/liabru/matter-js) ⭐18.4k — 选定的 2D 刚体物理引擎本体
- [dgkanatsios/AngryBirdsStyleGame](https://github.com/dgkanatsios/AngryBirdsStyleGame) ⭐678 — Unity 版关卡结构与机制参考
- [marblexu/PythonAngryBirds](https://github.com/marblexu/PythonAngryBirds) ⭐72 — 简洁实现的模块划分参考
- [crystal-bit/angry-aliens](https://github.com/crystal-bit/angry-aliens) ⭐66 — Godot 教程版，关卡设计参考
- [Mahdi7s/angrybirdsx](https://github.com/Mahdi7s/angrybirdsx) ⭐27 — JS + HTML5 + Box2D 实现
