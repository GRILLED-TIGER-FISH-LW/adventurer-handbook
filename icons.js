/* =========================================================================
 * 提瓦特冒险之证 · 本地业务图标字典 (自动去白边+居中正方形裁切版)
 * =========================================================================
 * 说明：
 * 1. wsrv.nl 代理加入 &w=256&h=256&fit=cover&trim=10
 * 2. 自动切除四周透明像素，并居中截取正方形
 * 3. 前端使用 object-fit: cover 让图片完美撑满容器
 * ========================================================================= */

window.LOCAL_ICONS = {
  // 游逸旅闻 (自动去白边 + 居中正方形裁切)
  tales: `<img src="https://wsrv.nl/?url=static.wikia.nocookie.net/gensin-impact/images/b/b5/Icon_Anecdote_Chronicles.png&w=256&h=256&fit=cover&trim=10" style="width:100%; height:100%; object-fit:cover;" alt="游历旅闻">`,
  talesBold: `<img src="https://wsrv.nl/?url=static.wikia.nocookie.net/gensin-impact/images/b/b5/Icon_Anecdote_Chronicles.png&w=256&h=256&fit=cover&trim=10" style="width:100%; height:100%; object-fit:cover;" alt="游历旅闻">`,

  // 尘歌壶赠礼套装 (自动去白边 + 居中正方形裁切)
  'gift-set': `<img src="https://wsrv.nl/?url=static.wikia.nocookie.net/gensin-impact/images/a/a5/Icon_Housing_Outdoor_Set_Set.png&w=256&h=256&fit=cover&trim=10" style="width:100%; height:100%; object-fit:cover;" alt="尘歌壶赠礼套装">`,
  'gift-setBold': `<img src="https://wsrv.nl/?url=static.wikia.nocookie.net/gensin-impact/images/a/a5/Icon_Housing_Outdoor_Set_Set.png&w=256&h=256&fit=cover&trim=10" style="width:100%; height:100%; object-fit:cover;" alt="尘歌壶赠礼套装">`
};
