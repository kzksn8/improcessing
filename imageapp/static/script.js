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

    // ドラッグ&ドロップゾーンの配置
    setupDragAndDrop_removebg();
});

// ====================================================

// button -> BTN, drag & drop zone -> DDZ

// 必要な要素の事前取得
const uploadBTN = document.getElementById('uploadBTN');
const removebgDDZ = document.getElementById('removebgDDZ');
const fileInput = document.getElementById('file_input');
const removebgBTN = document.getElementById('removebgBTN');
const cancelBTN = document.getElementById('cancelBTN');
const processingBTN = document.getElementById('processingBTN');
const downloadBTN = document.getElementById('downloadBTN');
const downloadingBTN = document.getElementById('downloadingBTN');
const outputImage = document.getElementById('output_image');

function setupDragAndDrop_removebg() {
    removebgDDZ.addEventListener('dragover', handleDragOver, false);
    removebgDDZ.addEventListener('drop', handleDrop, false);
    removebgDDZ.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleFileSelect);
    uploadBTN.addEventListener('click', () => fileInput.click());
    removebgBTN.addEventListener('click', () => startBackgroundRemoval(fileInput.files[0]));
    cancelBTN.addEventListener('click', resetToInitialState);
    downloadBTN.addEventListener('click', () => startDownload(window.processedImage));
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
            toggleElements(false, uploadBTN, removebgDDZ);
            toggleElements(true, removebgBTN, cancelBTN);
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
        toggleElements(false, removebgBTN);
        toggleElements(true, processingBTN);
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
        document.getElementById('processingBTN').style.display = 'none';
        document.getElementById('downloadBTN').style.display = 'block';

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
        toggleElements(false, downloadBTN, cancelBTN);
        toggleElements(true, downloadingBTN);
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
    document.getElementById('uploadBTN').style.display = 'block';
    var removebgDDZ = document.getElementById('removebgDDZ');
    removebgDDZ.style.display = 'flex';
    document.getElementById('removebgBTN').style.display = 'none';
    document.getElementById('processingBTN').style.display = 'none';
    document.getElementById('downloadBTN').style.display = 'none';
    document.getElementById('downloadingBTN').style.display = 'none';
    document.getElementById('cancelBTN').style.display = 'none';
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

// HTML要素の参照
const foregroundDDZ = document.getElementById('foregroundDDZ');
const backgroundDDZ = document.getElementById('backgroundDDZ');
const compositePreviewArea = document.getElementById('composite_preview_area');
const compositeBTN = document.getElementById('compositeBTN');
const downloadcompositeBTN = document.getElementById('downloadcompositeBTN');
const resetForegroundBTN = document.createElement('resetForegroundBTN');
const resetBackgroundBTN = document.createElement('resetBackgroundBTN');

// 合成ボタンとダウンロードボタンを非表示にする
document.getElementById('compositeBTN').style.display = 'none';
document.getElementById('downloadcompositeBTN').style.display = 'none';
// document.getElementById('resetForegroundBTN').style.display = 'block';
// document.getElementById('resetBackgroundBTN').style.display = 'block';

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
foregroundDDZ.addEventListener('click', () => compositeForegroundFileInput.click());
backgroundDDZ.addEventListener('click', () => compositeBackgroundFileInput.click());

// ファイル選択イベントの処理
compositeForegroundFileInput.addEventListener('change', (e) => {
    processCompositeFileSelect(e, 'foreground');
});
compositeBackgroundFileInput.addEventListener('change', (e) => {
    processCompositeFileSelect(e, 'background');
});

// ドラッグ＆ドロップイベントハンドラーの追加
foregroundDDZ.addEventListener('dragover', handleDragOver, false);
foregroundDDZ.addEventListener('drop', (e) => handleCompositeDrop(e, 'foreground'));
backgroundDDZ.addEventListener('dragover', handleDragOver, false);
backgroundDDZ.addEventListener('drop', (e) => handleCompositeDrop(e, 'background'));

function handleDragOver(e) {
    e.preventDefault(); // デフォルトの処理をキャンセル
    e.dataTransfer.dropEffect = 'copy'; // ドロップ時のカーソルスタイルをコピーに設定
}

// ドラッグ＆ドロップイベントのハンドラー
function handleCompositeDrop(e, type) {
    e.preventDefault();
    e.stopPropagation();
    const files = e.dataTransfer.files;
    if (files.length === 1 && files[0].type.match('image.*')) {
        processCompositeImage(files[0], type);
    } else {
        alert('画像ファイルを1つ選択してください。');
    }
}

// ファイル選択イベントの処理
function processCompositeFileSelect(e, type) {
    const files = e.target.files;
    if (files.length === 1) {
        const fileType = files[0].type;
        if (fileType === 'image/avif') {
            alert('サポートされていないファイル形式です。別の画像ファイルを選択してください。');
        } else if (fileType.match('image.*')) {
            processCompositeImage(files[0], type);
        } else {
            alert('サポートされていないファイル形式です。別の画像ファイルを選択してください。');
        }
    } else {
        alert('アップロードできる画像は1つのみです。');
    }
}

// リセットボタンの初期化関数
function initializeResetButton(button, text, ddzElement) {
    button.innerText = text;
    button.style.display = 'block'; // ボタンを常に表示
    ddzElement.parentNode.insertBefore(button, ddzElement.nextSibling);

    // リセットボタンのイベントハンドラー設定
    button.addEventListener('click', () => {
        const type = ddzElement.id === 'foregroundDDZ' ? 'foreground' : 'background';
        resetImage(type);
    });
}

// 画像処理関数
function processCompositeImage(file, type) {
    const reader = new FileReader();
    reader.onload = (e) => {
        const imageSrc = e.target.result;
        if (type === 'foreground') {
            compositeForegroundImage = imageSrc;
            updateDDZDisplay(foregroundDDZ, imageSrc, 'foreground');
        } else if (type === 'background') {
            compositeBackgroundImage = imageSrc;
            updateDDZDisplay(backgroundDDZ, imageSrc, 'background');
        }
        updateCompositeButtonVisibility();
    };
    reader.readAsDataURL(file);
}

// DDZ表示更新関数
function updateDDZDisplay(DDZElement, imageSrc, type) {
    // 既存の画像を削除する
    const existingImage = DDZElement.querySelector('img.preview');
    if (existingImage) {
        DDZElement.removeChild(existingImage);
    }

    // 新しい画像要素を作成して追加する
    const imageElement = new Image();
    imageElement.onload = function() {
        // 画像のアスペクト比を維持しながらサイズ調整
        const aspectRatio = this.width / this.height;
        const newHeight = DDZElement.offsetHeight;
        const newWidth = newHeight * aspectRatio;
        this.style.width = newWidth + 'px';
        this.style.height = newHeight + 'px';

        // 画像をドラッグ＆ドロップゾーンの直前に挿入
        DDZElement.parentNode.insertBefore(this, DDZElement);

        // ドラッグ＆ドロップゾーンを非表示にする
        DDZElement.style.display = 'none';
    };
    imageElement.src = imageSrc;
    imageElement.className = 'preview'; // クラスを追加

    // 対応するリセットボタンを取得して表示する
    const resetButton = type === 'foreground' ? resetForegroundBTN : resetBackgroundBTN;
    resetButton.style.display = 'block';
}

// 画像合成ボタンの表示制御
function updateCompositeButtonVisibility() {
    if (compositeForegroundImage && compositeBackgroundImage) {
        compositeBTN.style.display = 'block'; // compositeBTNに変更
    } else {
        compositeBTN.style.display = 'none'; // compositeBTNに変更
    }
}

// 画像リセット関数
function resetImage(type) {
    if (type === 'foreground') {
        compositeForegroundImage = null;
        const preview = foregroundDDZ.querySelector('img.preview');
        if (preview) preview.remove();
        foregroundDDZ.style.display = 'flex'; // DDZを再表示
    } else if (type === 'background') {
        compositeBackgroundImage = null;
        const preview = backgroundDDZ.querySelector('img.preview');
        if (preview) preview.remove();
        backgroundDDZ.style.display = 'flex'; // DDZを再表示
    }
    updateCompositeButtonVisibility();
}

// リセットボタンのイベントハンドラ
resetForegroundBTN.addEventListener('click', () => resetImage('foreground'));
resetBackgroundBTN.addEventListener('click', () => resetImage('background'));

function resetImage(type) {
    if (type === 'foreground') {
        compositeForegroundImage = null;
        foregroundDDZ.style.display = 'block';
        foregroundDDZ.nextElementSibling.remove(); // 前景画像プレビューを削除
    } else if (type === 'background') {
        compositeBackgroundImage = null;
        backgroundDDZ.style.display = 'block';
        backgroundDDZ.nextElementSibling.remove(); // 背景画像プレビューを削除
    }
    updateCompositeButtonVisibility();
}

// 画像合成ボタンのイベントハンドラ
compositeBTN.addEventListener('click', () => {
    console.log('合成ボタンがクリックされました。');
    
    // FormDataオブジェクトを作成し、画像データを追加
    var formData = new FormData();
    formData.append('foreground', dataURItoBlob(compositeForegroundImage));
    formData.append('background', dataURItoBlob(compositeBackgroundImage));
    console.log('送信するFormData:', formData);

    // サーバーに合成リクエストを送信
    fetch('composite-image/', {
        method: 'POST',
        body: formData,
        headers: {
            'X-CSRFToken': csrftoken
        }
    })
    .then(handleErrors)
    .then(response => response.json())
    .then(data => {
        console.log('合成画像のレスポンスデータ:', data);
        if (data.composite_image) {
            // 合成画像をプレビューとして表示
            const compositeImageSrc = `data:image/png;base64,${data.composite_image}`;
            compositePreviewArea.innerHTML = `<img src="${compositeImageSrc}" alt="Composite Image">`;
            // ダウンロードボタンを表示し、ダウンロードリンクを設定
            downloadcompositeBTN.style.display = 'block';
            downloadcompositeBTN.href = compositeImageSrc;
            downloadcompositeBTN.download = 'composite_image.png';
        } else {
            alert('画像の合成に失敗しました。');
        }
    })
    .catch(error => {
        console.error('画像合成中にエラーが発生しました:', error);
        alert('エラーが発生しました。コンソールを確認してください。');
    });
});

// ダウンロードボタンのイベントハンドラ
downloadcompositeBTN.addEventListener('click', () => {
    // キャンバスを作成
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // 背景画像をロード
    const backgroundImg = new Image();
    backgroundImg.src = compositeBackgroundImage;

    // 前景画像をロード
    const foregroundImg = new Image();
    foregroundImg.src = compositeForegroundImage;

    backgroundImg.onload = () => {
        // キャンバスのサイズを背景画像に合わせる
        canvas.width = backgroundImg.width;
        canvas.height = backgroundImg.height;

        // 背景画像をキャンバスに描画
        ctx.drawImage(backgroundImg, 0, 0);

        foregroundImg.onload = () => {
            // 前景画像をキャンバスに描画
            ctx.drawImage(foregroundImg, 0, 0, canvas.width, canvas.height);

            // キャンバスから画像のデータURLを取得
            const dataURL = canvas.toDataURL('image/png');

            // ダウンロードリンクを作成
            const downloadLink = document.createElement('a');
            downloadLink.href = dataURL;
            downloadLink.download = 'composite_image.png';
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
        };
    };
});

// Data URIをBlobに変換するヘルパー関数
function dataURItoBlob(dataURI) {
    var byteString = atob(dataURI.split(',')[1]);
    var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0]
    var ab = new ArrayBuffer(byteString.length);
    var ia = new Uint8Array(ab);
    for (var i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], {type: mimeString});
}

function handleErrors(response) {
    if (!response.ok) {
        // エラーレスポンスの内容をログに出力するために、レスポンスをクローンしてJSONを解析します。
        response.clone().json().then(json => {
            console.error('Error response JSON:', json);
        }).catch(() => {
            // JSONの解析に失敗した場合は、テキストとして出力します。
            response.clone().text().then(text => {
                console.error('Error response text:', text);
            });
        });
        throw Error(`HTTP error: ${response.status} ${response.statusText}`);
    }
    return response;
}