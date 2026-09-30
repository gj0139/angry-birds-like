// 关卡 5（夜晚）：地堡——双石墙 + 木顶，2 猪藏内 + 1 猪在顶。
// 内部猪必须砸穿墙/顶才能碰到，顶猪靠塌落。
export default {
  theme: 'night',
  birds: 3,
  blocks: [
    { x: 930, y: 750, w: 40, h: 100, material: 'stone' }, // left wall (bottom 800)
    { x: 1070, y: 750, w: 40, h: 100, material: 'stone' }, // right wall
    { x: 1000, y: 685, w: 220, h: 30, material: 'wood' }, // roof (bottom 700 = wall tops)
  ],
  pigs: [
    { x: 975, y: 778 }, // inside left
    { x: 1025, y: 778 }, // inside right
    { x: 1000, y: 648 }, // on roof (top 670)
  ],
};
