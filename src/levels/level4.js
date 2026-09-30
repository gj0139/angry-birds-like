// 关卡 4（沙漠）：跷跷板——支点 + 长梁 + 两端对称双层冰箱，3 猪。
// 整体左移：三只猪全部落在最远射程 (~x945) 内，均可直击或靠翻转坠杀。
// 两端箱体/猪完全对称（力矩平衡），加载时保持水平。
export default {
  theme: 'desert',
  birds: 3,
  blocks: [
    { x: 880, y: 770, w: 60, h: 60, material: 'stone' }, // fulcrum (bottom 800)
    { x: 880, y: 728, w: 320, h: 24, material: 'wood' }, // beam (bottom 740 = fulcrum top)
    { x: 820, y: 691, w: 50, h: 50, material: 'ice' }, // left box 1 (bottom 716)
    { x: 820, y: 641, w: 50, h: 50, material: 'ice' }, // left box 2 (bottom 666)
    { x: 940, y: 691, w: 50, h: 50, material: 'ice' }, // right box 1
    { x: 940, y: 641, w: 50, h: 50, material: 'ice' }, // right box 2
  ],
  pigs: [
    { x: 820, y: 594 }, // on left stack (top 616)
    { x: 940, y: 594 }, // on right stack
    { x: 860, y: 778 }, // under beam — inside the common landing band (x856-945)
  ],
};
