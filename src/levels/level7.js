// 关卡 7（海角）：石墙 + 长平台 + 双冰箱 + 顶梁，3 猪（顶梁/平台/地面）。
export default {
  theme: 'sea',
  birds: 3,
  blocks: [
    { x: 1010, y: 740, w: 60, h: 120, material: 'stone' }, // wall (bottom 800, top 680)
    { x: 1010, y: 665, w: 220, h: 30, material: 'wood' }, // platform (bottom 680 = wall top)
    { x: 970, y: 625, w: 50, h: 50, material: 'ice' }, // left box (bottom 650 = platform top)
    { x: 1060, y: 625, w: 50, h: 50, material: 'ice' }, // right box
    { x: 1015, y: 588, w: 140, h: 24, material: 'wood' }, // top beam (bottom 600 = box tops)
  ],
  pigs: [
    { x: 1015, y: 554 }, // on top beam (top 576)
    { x: 920, y: 628 }, // on platform left of boxes
    { x: 1200, y: 778 }, // ground
  ],
};
