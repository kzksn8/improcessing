// CSRFトークンをクッキーから取得
const csrftoken = getCookie('csrftoken');

// タブを切り替える関数
function changeTab(targetId) {
    // 全てのセクションを非表示にする
    const tabs = document.getElementsByClassName("tab-content");
    for (let tabcontent of tabs) {
        tabcontent.style.display = "none";
    }
    // アクティブなタブと対応するセクションを表示する
    const activeTab = document.getElementById(targetId);
    if (activeTab) {
        activeTab.style.display = "block";
    }
    // 対応するright-sectionも表示する
    const activeRightTab = document.getElementById(targetId.replace('-left', '-right'));
    if (activeRightTab) {
        activeRightTab.style.display = "block";
    }
}

// ページ読み込み時の処理
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('nav a').forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            const targetId = link.getAttribute('data-target');
            changeTab(targetId + '-left');
        });
    });
    // デフォルトでホームタブを表示
    changeTab('home-left');
    setupDragAndDrop();
});

// ====================================================

// 必要な要素の事前取得
const uploadButton = document.getElementById('upload_button');
const dropZone = document.getElementById('drop_zone');
const fileInput = document.getElementById('file_input');
const removeBgButton = document.getElementById('removebg_button');
const cancelButton = document.getElementById('cancel_button');
const processingButton = document.getElementById('processing_button');
const downloadButton = document.getElementById('download_button');
const downloadingButton = document.getElementById('downloading_button');
const outputImage = document.getElementById('output_image');

function setupDragAndDrop() {
    dropZone.addEventListener('dragover', handleDragOver, false);
    dropZone.addEventListener('drop', handleDrop, false);
    dropZone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleFileSelect);

    uploadButton.addEventListener('click', () => fileInput.click());
    removeBgButton.addEventListener('click', () => startBackgroundRemoval(fileInput.files[0]));
    cancelButton.addEventListener('click', resetToInitialState);
    downloadButton.addEventListener('click', () => startDownload(window.processedImage));
}

function handleDragOver(e) {
    e.stopPropagation();
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
}

function handleDrop(e) {
    e.stopPropagation();
    e.preventDefault();
    processFiles(e.dataTransfer.files);
}

function handleFileSelect(e) {
    processFiles(e.target.files);
}

function processFiles(files) {
    if (files.length === 1) {
        const fileType = files[0].type;

        if (fileType === 'image/avif') {
            alert('サポートされていないファイル形式です。別の画像ファイルを選択してください。');
        } else if (fileType.match('image.*')) {
            fileInput.files = files;
            toggleElements(false, uploadButton, dropZone);
            toggleElements(true, removeBgButton, cancelButton);
        } else {
            alert('サポートされていないファイル形式です。別の画像ファイルを選択してください。');
        }
    } else {
        alert('アップロードできる画像は1つのみです。');
    }
}

function toggleElements(show, ...elements) {
    elements.forEach(element => {
        element.style.display = show ? 'block' : 'none';
    });
}

// グローバル変数でAbortControllerの参照を保持
let abortController;

function startBackgroundRemoval(file) {
    if (file) {
        abortController = new AbortController();
        toggleElements(false, removeBgButton);
        toggleElements(true, processingButton);
        removeBackground(file);
    }
}

function removeBackground(file) {
    var formData = new FormData();
    formData.append('image', file);

    fetch('remove-background/', {
        method: 'POST',
        body: formData,
        headers: {
            'X-CSRFToken': csrftoken
        },
        signal: abortController.signal
    })
    .then(handleErrors)
    .then(response => response.json())
    .then(data => {
        // 「処理中...」ボタンを非表示にし、「ダウンロード」ボタンを表示
        document.getElementById('processing_button').style.display = 'none';
        document.getElementById('download_button').style.display = 'block';

        // 画像データをグローバル変数に保存
        window.processedImage = data.image;
    })
    .catch(error => {
        if (error.name === 'AbortError') {
            // 処理が中断された場合の処理
            console.log('Fetch aborted');
        } else {
            // その他のエラー処理
            console.error('Error:', error);
        }
    });
}

function startDownload(processedImage) {
    if (processedImage) {
        toggleElements(false, downloadButton, cancelButton);
        toggleElements(true, downloadingButton);
        triggerDownload(processedImage);
        setTimeout(resetToInitialState, 2000);
    }
}

function resetToInitialState() {
    if (abortController) {
        abortController.abort();
    }
    outputImage.style.display = 'none';
    resetForm();
    window.processedImage = undefined;
}

function resetForm() {
    document.getElementById('file_input').value = ''; // ファイル入力をリセット
    document.getElementById('upload_button').style.display = 'block';
    var dropZone = document.getElementById('drop_zone');
    dropZone.style.display = 'flex';
    document.getElementById('removebg_button').style.display = 'none';
    document.getElementById('processing_button').style.display = 'none';
    document.getElementById('download_button').style.display = 'none';
    document.getElementById('downloading_button').style.display = 'none';
    document.getElementById('cancel_button').style.display = 'none';
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

// エラーハンドリング関数
function handleErrors(response) {
    if (!response.ok) {
        throw Error(response.statusText);
    }
    return response;
}

// クッキーから特定の名前の値を取得する関数
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

// ====================================================

// 合成画像用のグローバル変数
let compositeForegroundImage = null;
let compositeBackgroundImage = null;

// ファイルインプット要素の作成
const compositeForegroundFileInput = document.createElement('input');
compositeForegroundFileInput.type = 'file';
compositeForegroundFileInput.accept = 'image/*';
compositeForegroundFileInput.style.display = 'none';

const compositeBackgroundFileInput = document.createElement('input');
compositeBackgroundFileInput.type = 'file';
compositeBackgroundFileInput.accept = 'image/*';
compositeBackgroundFileInput.style.display = 'none';

// HTMLにファイルインプット要素を追加
document.body.appendChild(compositeForegroundFileInput);
document.body.appendChild(compositeBackgroundFileInput);

// クリックイベントでファイル選択ダイアログを開くように設定
foregroundDropZone.addEventListener('click', () => compositeForegroundFileInput.click());
backgroundDropZone.addEventListener('click', () => compositeBackgroundFileInput.click());

// ファイル選択イベントの処理
compositeForegroundFileInput.addEventListener('change', (e) => {
    processCompositeFileSelect(e, 'foreground');
});
compositeBackgroundFileInput.addEventListener('change', (e) => {
    processCompositeFileSelect(e, 'background');
});

function processCompositeFileSelect(e, type) {
    // ファイルの処理
    const files = e.target.files;
    if (files.length === 1 && files[0].type.match('image.*')) {
        processCompositeImage(files[0], type);
    }
}

// 合成画像のプレビュー表示関数
function showCompositePreview() {
    if (compositeForegroundImage && compositeBackgroundImage) {
        // ここで合成画像のプレビューを表示
    }
}

// 合成画像のダウンロード関数
compositeDownloadButton.addEventListener('click', function() {
    if (!compositeForegroundImage || !compositeBackgroundImage) {
        alert('両方の画像が必要です。');
        return;
    }

    // ここでサーバーに合成リクエストを送信し、ダウンロードリンクを生成
    fetchCompositeImage();
});

function fetchCompositeImage() {
    var formData = new FormData();
    formData.append('foreground', compositeForegroundImage);
    formData.append('background', compositeBackgroundImage);

    fetch('composite-image/', {
        method: 'POST',
        body: formData,
        headers: {
            'X-CSRFToken': csrftoken
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.composite_image) {
            // ダウンロードリンクを生成して自動クリック
            var link = document.createElement('a');
            link.href = 'data:image/png;base64,' + data.composite_image;
            link.download = 'composite_image.png';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else {
            alert('画像の合成に失敗しました。');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('画像の合成中にエラーが発生しました。');
    });
}

// ドラッグ＆ドロップイベントのハンドラー
function handleCompositeDrop(event) {
    event.preventDefault();
    event.stopPropagation();
    const files = event.dataTransfer.files;

    if (files.length !== 1 || !files[0].type.match('image.*')) {
        alert('画像ファイルを1つ選択してください。');
        return;
    }

    const file = files[0];
    const targetElement = event.target;

    // ファイルのドロップ位置に応じて、ファイルの処理を行う
    const type = (targetElement === foregroundDropZone) ? 'foreground' : 'background';
    processCompositeImage(file, type);
}

function processCompositeImage(file, type) {
    // ファイルの読み込みと画像の表示
    const reader = new FileReader();
    reader.onload = (e) => {
        const imageSrc = e.target.result;
        if (type === 'foreground') {
            compositeForegroundImage = imageSrc;
        } else if (type === 'background') {
            compositeBackgroundImage = imageSrc;
        }
        showCompositePreview();
    };
    reader.readAsDataURL(file);
}

function showCompositePreview() {
    if (compositeForegroundImage && compositeBackgroundImage) {
        // 合成プレビュー画像を表示
        compositePreviewArea.innerHTML = `
            <img src="${compositeBackgroundImage}" alt="Background" style="width: 100%; height: auto;">
            <img src="${compositeForegroundImage}" alt="Foreground" style="position: absolute; top: 0; left: 0; width: 100%; height: auto;">
        `;
    }
}