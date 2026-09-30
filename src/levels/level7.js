// 关卡 7（海角）：阶梯错层——木/冰/石三级台阶，猪逐级站立。
// 站得越高塌得越致命（坠落 ≥8px/step 即死），逼你自上而下拆。
export default {
  theme: 'sea',
  birds: 3,
  blocks: [
    { x: 930, y: 770, w: 60, h: 60, material: 'wood' }, // step 1 (bottom 800)
    { x: 1030, y: 750, w: 60, h: 100, material: 'ice' }, // step 2
    { x: 1130, y: 730, w: 60, h: 140, material: 'stone' }, // step 3 (toughest on top)
  ],
  pigs: [
    { x: 930, y: 718 }, // on step 1 (top 740)
    { x: 1030, y: 678 }, // on step 2 (top 700)
    { x: 1130, y: 638 }, // on step 3 (top 660)
  ],
};
