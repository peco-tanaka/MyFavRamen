// 最小限のService Worker - 実質的には何もしない
self.addEventListener('fetch', function(event) {
  // 通常のネットワークリクエストを行う
  return;
});