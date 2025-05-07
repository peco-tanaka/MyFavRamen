// app/javascript/utilities/ranking_item_helper.js

export const RankingItemHelper = {
  // 初期化メソッド：コールバック関数の設定
  initialize(callbacks = {}) {
    this.callbacks = {
      onSaveStart: callbacks.onSaveStart || (() => {}),
      onSaveSuccess: callbacks.onSaveSuccess || (() => {}),
      onSaveError: callbacks.onSaveError || (() => {}),
      onUpdateStart: callbacks.onUpdateStart || (() => {}),
      onUpdateSuccess: callbacks.onUpdateSuccess || (() => {}),
      onUpdateError: callbacks.onUpdateError || (() => {})
    };
    return this;
  },

  // CSRFトークンを取得するヘルパーメソッド
  getCSRFToken() {
    const metaTag = document.querySelector('meta[name="csrf-token"]');
    return metaTag ? metaTag.content : '';
  },

  // サーバーにランキングアイテムを保存するメソッド
  async saveRankingItem(data, baseUrl, rankingId) {
    this.callbacks.onSaveStart();

    try {
      // ★★★ リクエストURLの末尾に ".json" を追加 ★★★
      const url = baseUrl.endsWith('/') ? `${baseUrl.slice(0, -1)}.json` : `${baseUrl}.json`;
      console.log("Requesting URL:", url);

      // フェッチAPIを使ってPOSTリクエストを送信
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': this.getCSRFToken()
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error(`サーバーエラー： ${response.status}`);
      }

      const result = await response.json();
      this.callbacks.onSaveSuccess(result);
      
      return result;
    } catch (error) {
      console.error("保存中にエラーが発生しました", error);
      this.callbacks.onSaveError(error);
      throw error;
    }
  },

  // FormDataを使用してランキングアイテムを保存するメソッド（画像アップロード対応）
  async saveRankingItemWithFormData(formData, baseUrl, rankingId) {
    this.callbacks.onSaveStart();

    try {
      // リクエストURLを設定（.jsonを追加しない）
      const url = baseUrl;
      console.log("FormDataで送信するURL:", url);

      // フェッチAPIを使ってPOSTリクエストを送信
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'X-CSRF-Token': this.getCSRFToken(),
          'Accept': 'application/json'
          // Content-Typeヘッダーは自動的に設定される
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`サーバーエラー： ${response.status}`);
      }

      const result = await response.json();
      this.callbacks.onSaveSuccess(result);
      
      return result;
    } catch (error) {
      console.error("保存中にエラーが発生しました", error);
      this.callbacks.onSaveError(error);
      throw error;
    }
  },

  // 編集フォームを取得するメソッド
  async fetchEditForm(rankingId, itemId) {
    try {
      const response = await fetch(`/rankings/${rankingId}/ranking_items/${itemId}/edit`, {
        headers: {
          'Accept': 'text/html',
          'X-Requested-With': 'XMLHttpRequest'
        }
      });

      if (!response.ok) {
        throw new Error(`サーバーエラー： ${response.status}`);
      }

      return await response.text();
    } catch (error) {
      console.error("編集フォームの取得中にエラーが発生しました", error);
      throw error;
    }
  },

  // ランキングアイテムを更新するメソッド
  async updateRankingItem(formElement) {
    this.callbacks.onUpdateStart();

    try {
      const formData = new FormData(formElement);

      const response = await fetch(formElement.action, {
        method: formElement.method,
        headers: {
          'X-CSRF-Token': this.getCSRFToken(),
          'Accept': 'application/json'
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`サーバーエラー： ${response.status}`);
      }

      const result = await response.json();
      this.callbacks.onUpdateSuccess(result);
      
      return result;
    } catch (error) {
      console.error("更新中にエラーが発生しました", error);
      this.callbacks.onUpdateError(error);
      throw error;
    }
  },

  // ランキングアイテム要素をDOMに追加するメソッド
  addItemToDom(item, rankingId) {
    // 新しいランキングアイテム要素を作成
    const newItem = document.createElement('div');
    newItem.className = 'card mb-2 border-0 shadow-sm ranking-item';
    newItem.dataset.id = item.id;
    newItem.dataset.rankingSortTarget = 'item';

    // 現在の最後の順位を取得して新しいアイテムの順位を設定
    const currentItems = document.querySelectorAll('[data-ranking-sort-target="item"]');
    const newPosition = currentItems.length + 1;

    // ランキングアイテムの内容を構築
    newItem.innerHTML = `
      <div class="card-body p-2">
        <div class="row align-items-center">
          <div class="col-1 text-center ps-2">
            <!-- ランク表示 -->
            <span class="position-number fw-bold fs-6 ${newPosition <= 3 ? 'text-' + ['warning', 'secondary', 'danger'][newPosition-1] : ''}">
              ${newPosition}
            </span>
          </div>

          <div class="col-auto px-0">
            <!-- 画像プレビュー -->
            <div class="placeholder-img img-thumbnail d-flex align-items-center justify-content-center"
                style="width: 70px; height: 70px; background-color: #f8f9fa; border-radius: 0.25rem;">
              <i class="bi bi-image text-muted"></i>
            </div>
          </div>

          <div class="col text-start px-1">
            <!-- 店舗・メニュー情報 -->
            <h6 class="card-title mb-0 fs-6">
              ${item.shop_name}
              ${item.is_manual ? '<span class="badge bg-secondary ms-1" style="font-size: 0.5em;">手動登録</span>' : ''}
            </h6>
            <p class="card-text small text-muted mb-0" style="font-size: 0.7rem;">${item.menu_name}</p>
          </div>

          <div class="col-1 text-end d-flex flex-column align-items-end px-1">
            <!-- 操作ボタン -->
            <button type="button" class="btn btn-sm btn-outline-primary edit-item-btn mb-2" data-id="${item.id}" 
                style="font-size: 0.7rem; padding: 0.15rem 0.3rem; width: 100%; height: auto; display: flex; flex-direction: column; align-items: center;">
              <i class="bi bi-pencil-fill"></i>
              <span class="d-none d-md-block" style="font-size: 0.65rem; margin-top: 2px;">編集</span>
            </button>
            <a href="/rankings/${rankingId}/ranking_items/${item.id}" 
              data-turbo-method="delete"
              data-turbo-confirm="このラーメン店をランキングから削除してもよろしいですか？"
              class="btn btn-sm btn-outline-danger"
              style="font-size: 0.7rem; padding: 0.15rem 0.3rem; width: 100%; height: auto; display: flex; flex-direction: column; align-items: center;">
              <i class="bi bi-trash-fill"></i>
              <span class="d-none d-md-block" style="font-size: 0.65rem; margin-top: 2px;">削除</span>
            </a>
          </div>
        </div>
      </div>
    `;

    // 空のランキングメッセージがあれば削除
    const emptyMessage = document.querySelector('.empty-ranking-message');
    if (emptyMessage) {
      emptyMessage.remove();
    }

    // ランキングアイテムリストに新しいアイテムを追加
    const rankingList = document.querySelector('[data-ranking-sort-target="container"]');
    if (rankingList) {
      rankingList.appendChild(newItem);
      return newItem;
    }
    
    return null;
  },

  // DOM上のアイテム情報を更新するメソッド
  updateItemInDom(item, itemId) {
    // 更新対象の要素を取得
    const itemElement = document.querySelector(`[data-id="${itemId}"]`);

    if (!itemElement) {
      console.error(`ID: ${itemId} のアイテムが見つかりません`);
      return false;
    }

    // 店舗名とメニュー名を更新
    const shopNameElement = itemElement.querySelector('.card-title');
    const menuNameElement = itemElement.querySelector('.card-text');

    if (shopNameElement) shopNameElement.textContent = item.shop_name;
    if (menuNameElement) menuNameElement.textContent = item.menu_name;

    // 画像があれば更新
    if (item.photo_url) {
      const imgContainer = itemElement.querySelector('.col-2');
      if (imgContainer) {
        imgContainer.innerHTML = `
          <img src="${item.photo_url}" class="img-thumbnail"
            style="width: 70px; height: 70px; object-fit: cover;">
        `;
      }
    }

    // 1位のコメントがあれば更新
    if (item.position === 1 && item.comment) {
      const commentContainer = itemElement.querySelector('.col-5 p:last-child');

      // コメントがまだなければ新規追加
      if (!commentContainer || !commentContainer.querySelector('.bi-chat-quote-fill')) {
        const textContainer = itemElement.querySelector('.col-5');
        if (textContainer) {
          const commentEl = document.createElement('p');
          commentEl.className = 'small mb-0 text-truncate';
          commentEl.innerHTML = `
            <i class="bi bi-chat-quote-fill text-warning me-1"></i>
            ${item.comment.length > 30 ? item.comment.substring(0, 27) + '...' : item.comment}
          `;
          textContainer.appendChild(commentEl);
        }
      } else if (commentContainer) {
        // コメント要素があれば内容だけ更新
        const commentText = commentContainer.lastChild;
        commentText.textContent = item.comment.length > 30 ? item.comment.substring(0, 27) + '...' : item.comment;
      }
    }
    
    return true;
  }
};