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

// タブを切り替える関数
function changeTab(targetId) {
    var i, tabcontents;
    
    // 全てのタブコンテンツを非表示にする
    tabcontents = document.getElementsByClassName("tab-content");
    for (i = 0; i < tabcontents.length; i++) {
        tabcontents[i].style.display = "none";
    }

    // 選択されたタブのコンテンツを表示する
    document.getElementById(targetId).style.display = "block";
}

// ページが読み込まれたらイベントリスナーを設定
document.addEventListener('DOMContentLoaded', function() {
    // すべてのナビゲーションリンクを取得
    var navLinks = document.querySelectorAll('nav a');
    // リンクごとにクリックイベントリスナーを設定
    navLinks.forEach(function(link) {
        link.addEventListener('click', function(event) {
            event.preventDefault(); // ページ遷移を防ぐ
            var targetId = this.getAttribute('data-target'); // data-target属性からIDを取得
            changeTab(targetId); // タブを切り替える
        });
    });

    // ページ読み込み時にホームタブを表示する
    changeTab('home');
});

// 画像アップロードボタンのイベントリスナーを設定
document.getElementById('upload_button').addEventListener('click', function() {
    // ファイル選択ダイアログを開く
    document.getElementById('file_input').click();
});

// ドラッグオーバー時のデフォルト処理を無効化
function handleDragOver(e) {
    e.stopPropagation();
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy'; // ドラッグされたデータがコピーされる
}

// ドロップ時の処理
function handleDrop(e) {
    e.stopPropagation();
    e.preventDefault();
    var files = e.dataTransfer.files;

    // ファイルが1つのみであることを確認
    if (files.length === 1) {
        var file = files[0];
        if (file.type.match('image.*')) {
            // ファイルをフォームに設定
            document.getElementById('file_input').files = files;
            // 'アップロード'ボタンを非表示
            document.getElementById('upload_button').style.display = 'none';
            // '背景削除'ボタンと'リセット'ボタンを表示
            document.getElementById('removebg_button').style.display = 'block';
            document.getElementById('cancel_button').style.display = 'block';
        } else {
            alert('画像ファイルを選択してください。');
        }
    } else {
        alert('アップロードできる画像は1つのみです。');
    }

    // 'アップロード'と'ドロップゾーン'と'ダウンロード'を非表示、'背景削除'と'リセット'を表示
    document.getElementById('upload_button').style.display = 'none';
    document.getElementById('drop_zone').style.display = 'none';
    document.getElementById('removebg_button').style.display = 'block';
    document.getElementById('cancel_button').style.display = 'block';
    document.getElementById('download_button').style.display = 'none';
}

// クリック時の処理
document.addEventListener('DOMContentLoaded', function () {
    var dropZone = document.getElementById('drop_zone');
    var fileInput = document.getElementById('file_input');

    // ドラッグオーバー時のデフォルト処理を無効化
    dropZone.addEventListener('dragover', handleDragOver, false);
    // ドロップ時の処理
    dropZone.addEventListener('drop', handleDrop, false);
    // ドラッグ＆ドロップゾーンがクリックされたときにファイル入力を開く
    dropZone.addEventListener('click', function() {
        fileInput.click();
    });
    // ファイル入力要素の変更イベントを処理する
    fileInput.addEventListener('change', function(e) {
        // ファイルが選択されたときの処理
        var files = e.target.files;

        // ファイルが1つのみであることを確認
        if (files.length === 1) {
            var file = files[0];
            if (file.type.match('image.*')) {
                // 'アップロード'ボタンを非表示
                document.getElementById('upload_button').style.display = 'none';
                // ファイルをフォームに設定し、「背景削除」ボタンと「リセット」ボタンを表示
                document.getElementById('removebg_button').style.display = 'block';
                document.getElementById('cancel_button').style.display = 'block';
            } else {
                alert('画像ファイルを選択してください。');
            }
        } else {
            alert('アップロードできる画像は1つのみです。');
            resetForm();
        }

    // 'アップロード'と'ドロップゾーン'と'ダウンロード'を非表示、'背景削除'と'リセット'を表示
    document.getElementById('upload_button').style.display = 'none';
    document.getElementById('drop_zone').style.display = 'none';
    document.getElementById('removebg_button').style.display = 'block';
    document.getElementById('cancel_button').style.display = 'block';
    document.getElementById('download_button').style.display = 'none';
    });
});

// フォームをリセットする関数
function resetForm() {
    document.getElementById('file_input').value = '';
    document.getElementById('removebg_button').style.display = 'none';
    document.getElementById('download_button').style.display = 'none';
    document.getElementById('cancel_button').style.display = 'none';
}

// '背景削除' ボタンクリック時の処理
document.getElementById('removebg_button').addEventListener('click', function() {
    var file = document.getElementById('file_input').files[0];
    if (file) {
        // '背景削除'・'リセット'を非表示にし、「処理中...」ボタンを表示
        document.getElementById('removebg_button').style.display = 'none';
        document.getElementById('cancel_button').style.display = 'none';
        document.getElementById('processing_button').style.display = 'block';

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
        // 画像処理が完了したら、「処理中...」ボタンを非表示にし、「ダウンロード」「リセット」ボタンを表示
        document.getElementById('processing_button').style.display = 'none';
        document.getElementById('download_button').style.display = 'block';
        document.getElementById('cancel_button').style.display = 'block';

        // 画像データをグローバル変数に保存
        window.processedImage = data.image;
    })
    .catch(error => {
        console.error('Error:', error);
        alert('エラーが発生しました。画像の背景を削除できませんでした。');
    });
}

function resetToInitialState() {
    // 画像プレビューを非表示にする
    var outputImage = document.getElementById('output_image');
    if (outputImage) {
        outputImage.style.display = 'none';
        outputImage.src = '';
    }

    // ファイル入力をリセット
    document.getElementById('file_input').value = '';
    
    // 'アップロード'ボタンを表示
    document.getElementById('upload_button').style.display = 'block';

    // ドロップゾーンを初期状態に戻す
    var dropZone = document.getElementById('drop_zone');
    dropZone.style.display = 'flex';

    // その他のボタンを非表示に
    document.getElementById('removebg_button').style.display = 'none';
    document.getElementById('download_button').style.display = 'none';
    document.getElementById('cancel_button').style.display = 'none';

    // グローバル変数をクリアする
    window.processedImage = undefined;
}

// 'ダウンロード' ボタンクリック時の処理
document.getElementById('download_button').addEventListener('click', function() {
    if (window.processedImage) {
        triggerDownload(window.processedImage); // ここでダウンロードを開始
    }
    // ファイル入力をリセットし、初期状態に戻す
    resetToInitialState();
});

// 'リセット' ボタンクリック時の処理
document.getElementById('cancel_button').addEventListener('click', function() {
    // ファイル入力をリセットし、初期状態に戻す
    resetToInitialState();
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