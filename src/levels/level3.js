// 关卡 3：石基 + 木柱 + 冰顶 + 顶层木箱三层塔，3 猪（塔内/塔顶/侧翼）。
export default {
  theme: 'dusk',
  birds: 3,
  blocks: [
    { x: 960, y: 770, w: 180, h: 60, material: 'stone' }, // base on ground
    { x: 920, y: 690, w: 25, h: 100, material: 'wood' }, // left col (bottom 740 = base top)
    { x: 1000, y: 690, w: 25, h: 100, material: 'wood' }, // right col
    { x: 960, y: 628, w: 140, h: 24, material: 'ice' }, // ice slab on cols (top 640)
    { x: 960, y: 591, w: 50, h: 50, material: 'wood' }, // top box on ice (top 616)
  ],
  pigs: [
    { x: 960, y: 718 }, // inside tower on base (base top 740)
    { x: 960, y: 544 }, // on top box (box top 566)
    { x: 1150, y: 778 }, // side wing on ground
  ],
};
