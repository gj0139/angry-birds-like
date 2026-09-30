// 关卡 9（水域）：入门水池，木箱/冰箱各载一猪，另两只泡在水底，共 4 猪。
// 显示位置经折射上浮（refractY），瞄准必须用真实位置。
export default {
  theme: 'water',
  water: { x: 860, y: 560, w: 580, h: 240 },
  birds: 3,
  blocks: [
    { x: 920, y: 770, w: 60, h: 60, material: 'wood' }, // on ground under water
    { x: 1120, y: 770, w: 60, h: 60, material: 'ice' },
  ],
  pigs: [
    { x: 920, y: 718 }, // on wood box (top 740)
    { x: 1120, y: 718 }, // on ice box
    { x: 1020, y: 778 }, // pool floor between
    { x: 1300, y: 778 }, // pool floor far side
  ],
};
