document.getElementById('drop_zone').addEventListener('drop', handleDrop, false);
document.getElementById('remove_bg_button').addEventListener('click', removeBackground, false);

function handleDrop(e) {
    e.stopPropagation();
    e.preventDefault();
    var files = e.dataTransfer.files; // ドロップされたファイルを取得
    // ここでファイルを処理
}

function removeBackground() {
    // 画像ファイルをFormDataとして送信
    var formData = new FormData();
    formData.append('image', /* ドロップされた画像ファイル */);

    fetch('/imageapp/remove-background/', {
        method: 'POST',
        body: formData
    }).then(response => response.json())
      .then(data => {
          // 処理された画像を表示
          // ダウンロードとキャンセルのボタンを表示
      }).catch(error => console.error(error));
}

// ユーザーがドラッグ＆ドロップで画像をアップロードする際の処理を具体化

function handleDrop(e) {
    e.stopPropagation();
    e.preventDefault();

    var files = e.dataTransfer.files;
    if (files.length > 0) {
        var file = files[0];
        if (file.type.match('image.*')) {
            var formData = new FormData();
            formData.append('image', file);
            removeBackground(formData);
        }
    }
}

// サーバーからのレスポンスを処理

function removeBackground(formData) {
    fetch('/imageapp/remove-background/', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        var outputImage = document.getElementById('output_image');
        outputImage.src = 'data:image/png;base64,' + data.image;
        outputImage.style.display = 'block';
        document.getElementById('download_button').style.display = 'block';
        document.getElementById('cancel_button').style.display = 'block';
    })
    .catch(error => console.error('Error:', error));
}

// ダウンロードボタンにイベントリスナーを追加し、処理された画像をダウンロードする機能を実装

document.getElementById('download_button').addEventListener('click', function() {
    var outputImage = document.getElementById('output_image').src;
    var link = document.createElement('a');
    link.href = outputImage;
    link.download = 'processed_image.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
});

// キャンセルボタンのイベントリスナーを追加し、処理をリセット

document.getElementById('cancel_button').addEventListener('click', function() {
    document.getElementById('output_image').style.display = 'none';
    document.getElementById('download_button').style.display = 'none';
    document.getElementById('cancel_button').style.display = 'none';
});

// アップロードや処理の際に発生する可能性のあるエラーを適切にハンドリング
// 例えば、ネットワークエラーやサーバーのレスポンスエラーに対してユーザーに通知

function handleErrors(response) {
    if (!response.ok) {
        throw Error(response.statusText);
    }
    return response;
}

function removeBackground(formData) {
    fetch('/imageapp/remove-background/', {
        method: 'POST',
        body: formData
    })
    .then(handleErrors)
    .then(response => response.json())
    .then(data => {
        // 成功時の処理
    })
    .catch(error => {
        console.error('Error:', error);
        alert('エラーが発生しました。');
    });
}