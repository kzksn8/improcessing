// CSRFトークンをクッキーから取得する関数
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

// CSRFトークンを取得
const csrftoken = getCookie('csrftoken');

// ドラッグオーバー時のデフォルト処理を無効化
function handleDragOver(e) {
    e.stopPropagation();
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy'; // ドラッグされたデータがコピーされることを示す
}

// ドロップ時の処理
function handleDrop(e) {
    e.stopPropagation();
    e.preventDefault();
    var files = e.dataTransfer.files;
    if (files.length > 0) {
        var file = files[0];
        if (file.type.match('image.*')) {
            // ファイルをフォームに設定し、「背景削除」ボタンを表示
            document.getElementById('file_input').files = files;
            document.getElementById('remove_bg_button').style.display = 'block';
            document.getElementById('cancel_button').style.display = 'block'; // 「キャンセル」ボタンも表示
        } else {
            alert('画像ファイルを選択してください。');
        }
    }
}

// '背景削除' ボタンクリック時の処理
document.getElementById('remove_bg_button').addEventListener('click', function() {
    var file = document.getElementById('file_input').files[0];
    if (file) {
        removeBackground(file);
    }
});

// バックグラウンドを削除する関数
function removeBackground(file) {
    var formData = new FormData();
    formData.append('image', file);

    fetch('remove-background/', {
        method: 'POST',
        body: formData,
        headers: {
            'X-CSRFToken': csrftoken
        }
    })
    .then(handleErrors)
    .then(response => response.json())
    .then(data => {
        // 画像データをグローバル変数に保存
        window.processedImage = data.image;
        // ここで 'ダウンロード' ボタンと 'キャンセル' ボタンを表示
        document.getElementById('download_button').style.display = 'block';
        document.getElementById('cancel_button').style.display = 'block';
    })
    .catch(error => {
        console.error('Error:', error);
        alert('エラーが発生しました。画像の背景を削除できませんでした。');
    });
}

// 'ダウンロード' ボタンクリック時の処理
document.getElementById('download_button').addEventListener('click', function() {
    if (window.processedImage) {
        triggerDownload(window.processedImage); // ここでダウンロードを開始
    }
});

// 'キャンセル' ボタンクリック時の処理
document.getElementById('cancel_button').addEventListener('click', function() {
    // 画像プレビューを非表示にする
    var outputImage = document.getElementById('output_image');
    if (outputImage) {
        outputImage.style.display = 'none';
        outputImage.src = '';
    }
    // ファイル入力をリセット
    document.getElementById('file_input').value = '';
    // 'ダウンロード' と 'キャンセル' ボタンを非表示にする
    document.getElementById('remove_bg_button').style.display = 'none';
    document.getElementById('download_button').style.display = 'none';
    document.getElementById('cancel_button').style.display = 'none';
    // '背景削除' ボタンは表示されたままにする
    // document.getElementById('remove_bg_button').style.display = 'block'; ← この行を削除
    // グローバル変数をクリアする
    window.processedImage = undefined;
});

// エラーハンドリング関数
function handleErrors(response) {
    if (!response.ok) {
        throw Error(response.statusText);
    }
    return response;
}

// Base64エンコードされた画像データをダウンロードする関数
function triggerDownload(base64Data) {
    var link = document.createElement('a');
    link.href = 'data:image/png;base64,' + base64Data;
    link.download = 'processed_image.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// イベントリスナーを設定
document.addEventListener('DOMContentLoaded', function () {
    var dropZone = document.getElementById('drop_zone');
    var fileInput = document.getElementById('file_input');

    dropZone.addEventListener('dragover', handleDragOver, false);
    dropZone.addEventListener('drop', handleDrop, false);

    // ドラッグ＆ドロップゾーンがクリックされたときにファイル入力を開く
    dropZone.addEventListener('click', function() {
        fileInput.click();
    });

    // ファイル入力要素の変更イベントを処理する
    fileInput.addEventListener('change', function() {
        if (this.files && this.files[0]) {
            var file = this.files[0];
            if (file.type.match('image.*')) {
                document.getElementById('remove_bg_button').style.display = 'block';
                removeBackground(file);
            } else {
                alert('画像ファイルを選択してください。');
            }
        }
    });
});