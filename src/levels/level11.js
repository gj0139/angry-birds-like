// 关卡 11（水域终章）：沉水石堡 + 冰顶木塔，6 猪
// （堡内 2 / 堡顶 / 塔顶 / 池底 2），塔左移给右侧池底猪留出生位。
export default {
  theme: 'water',
  water: { x: 460, y: 560, w: 820, h: 240 },
  birds: 3,
  blocks: [
    { x: 900, y: 750, w: 40, h: 100, material: 'stone' }, // fort left wall (bottom 800)
    { x: 1040, y: 750, w: 40, h: 100, material: 'stone' }, // fort right wall
    { x: 970, y: 685, w: 200, h: 30, material: 'wood' }, // fort roof (bottom 700)
    { x: 1180, y: 730, w: 60, h: 140, material: 'wood' }, // tower (bottom 800, top 660)
    { x: 1180, y: 648, w: 70, h: 24, material: 'ice' }, // ice cap (bottom 660)
  ],
  pigs: [
    { x: 945, y: 778 }, // inside fort left
    { x: 995, y: 778 }, // inside fort right
    { x: 970, y: 648 }, // on fort roof (top 670)
    { x: 1180, y: 614 }, // on ice cap (top 636)
    { x: 1100, y: 778 }, // pool floor (clear of tower edge 1150)
    { x: 1250, y: 778 }, // pool floor far side
  ],
};
