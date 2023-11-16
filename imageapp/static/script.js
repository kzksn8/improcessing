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
            removeBackground(file);
        } else {
            alert('画像ファイルを選択してください。');
        }
    }
}

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
        triggerDownload(data.image); // ダウンロードを開始する
    })
    .catch(error => {
        console.error('Error:', error);
        alert('エラーが発生しました。画像の背景を削除できませんでした。');
    });
}

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
    dropZone.addEventListener('dragover', handleDragOver, false);
    dropZone.addEventListener('drop', handleDrop, false);
});