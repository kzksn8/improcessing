// CSRFトークンをクッキーから取得
const csrftoken = getCookie('csrftoken');

// タブを切り替える関数の修正
function changeTab(targetId) {
    const tabs = document.getElementsByClassName("tab-content");
    for (let tabcontent of tabs) {
        tabcontent.style.display = "none";
    }

    const activeTab = document.getElementById(targetId);
    if (activeTab) {
        activeTab.style.display = "block";
    }

    const activeRightTab = document.getElementById(targetId.replace('-left', '-right'));
    if (activeRightTab) {
        activeRightTab.style.display = "block";
    }

    // 合成リセットボタンの表示を「画像合成」タブがアクティブの時のみにする
    const resetCompositeButton = document.getElementById('resetCompositeButton');
    const isCompositeTab = targetId.includes('composite');
    resetCompositeButton.style.display = isCompositeTab ? 'block' : 'none';
}

// ページ読み込み時の処理
document.addEventListener('DOMContentLoaded', () => {
    // タブ関連のイベントリスナーを設定
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

    // リセットボタンのセットアップ関数を呼び出し
    setupResetCompositeButton();
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
let resetCompositeButton;

// HTML要素の参照
const foregroundDDZ = document.getElementById('foregroundDDZ');
const backgroundDDZ = document.getElementById('backgroundDDZ');
const compositePreviewArea = document.getElementById('composite_preview_area');
const compositeBTN = document.getElementById('compositeBTN');
const downloadcompositeBTN = document.getElementById('downloadcompositeBTN');

// 合成ボタンとダウンロードボタンを非表示にする
document.getElementById('compositeBTN').style.display = 'none';
document.getElementById('downloadcompositeBTN').style.display = 'none';

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

// すべての画像とプレビューをリセットする関数
function resetAllImages() {
    compositeForegroundImage = null;
    compositeBackgroundImage = null;
    clearPreviews();
    resetDDZDisplay();
    updateCompositeButtonVisibility();
}

// プレビューをクリアする関数
function clearPreviews() {
    const previewImages = document.querySelectorAll('.preview');
    previewImages.forEach(image => image.remove());
}

// ドラッグ＆ドロップゾーンの表示をリセットする関数
function resetDDZDisplay() {
    const ddzElements = document.querySelectorAll('.compositeDDZ');
    ddzElements.forEach(ddz => ddz.style.display = 'block');
}

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

// 画像リセット関数
function resetImage(type) {
    if (type === 'foreground') {
        compositeForegroundImage = null;
        const preview = foregroundDDZ.querySelector('img.preview');
        if (preview) {
            // 画像プレビューがあれば削除
            preview.remove();
        } else {
            // なければ表示スタイルをリセット
            foregroundDDZ.style.display = 'flex';
        }
        compositeForegroundFileInput.value = ''; // ファイル入力をリセット
    } else if (type === 'background') {
        compositeBackgroundImage = null;
        const preview = backgroundDDZ.querySelector('img.preview');
        if (preview) {
            // 画像プレビューがあれば削除
            preview.remove();
        } else {
            // なければ表示スタイルをリセット
            backgroundDDZ.style.display = 'flex';
        }
        compositeBackgroundFileInput.value = ''; // ファイル入力をリセット
    }
    updateCompositeButtonVisibility();
}

// すべての画像とプレビューをリセットする関数
function resetAllImages() {
    compositeForegroundImage = null;
    compositeBackgroundImage = null;
    clearPreviews();
    resetDDZDisplay();
    updateCompositeButtonVisibility();
    compositeForegroundFileInput.value = ''; // ファイル入力をリセット
    compositeBackgroundFileInput.value = ''; // ファイル入力をリセット
}

// 画像処理関数
function processCompositeImage(file, type) {
    const reader = new FileReader();
    reader.onload = (e) => {
        const imageSrc = e.target.result;
        if (type === 'foreground') {
            compositeForegroundImage = imageSrc;
            console.log("前景画像設定:", compositeForegroundImage); // ログ追加
            updateDDZDisplay(foregroundDDZ, imageSrc, 'foreground');
        } else if (type === 'background') {
            compositeBackgroundImage = imageSrc;
            console.log("背景画像設定:", compositeBackgroundImage); // ログ追加
            updateDDZDisplay(backgroundDDZ, imageSrc, 'background');
        }
        updateCompositeButtonVisibility();
    };
    reader.readAsDataURL(file);
}

// DDZ表示更新関数
function updateDDZDisplay(DDZElement, imageSrc, type) {
    const existingImage = DDZElement.querySelector('img.preview');
    if (existingImage) {
        DDZElement.removeChild(existingImage);
    }

    const imageElement = new Image();
    imageElement.onload = function() {
        let newWidth, newHeight;
        const parentWidth = DDZElement.offsetWidth;
        const parentHeight = DDZElement.offsetHeight;
        const aspectRatio = this.width / this.height;

        if (parentWidth / parentHeight > aspectRatio) {
            newHeight = parentHeight;
            newWidth = aspectRatio * newHeight;
        } else {
            newWidth = parentWidth;
            newHeight = newWidth / aspectRatio;
        }

        this.style.width = newWidth + 'px';
        this.style.height = newHeight + 'px';
        this.className = 'preview';

        DDZElement.parentNode.insertBefore(this, DDZElement.nextSibling);
        DDZElement.style.display = 'none';
    };
    imageElement.src = imageSrc;
}

// 画像合成ボタンの表示制御
function updateCompositeButtonVisibility() {
    // 「ダウンロード」ボタンの表示状態をここで制御しないようにします。
    if (compositeForegroundImage && compositeBackgroundImage) {
        compositeBTN.style.display = 'block';
    } else {
        compositeBTN.style.display = 'none';
    }
}

// 画像合成ボタンのイベントハンドラ
compositeBTN.addEventListener('click', () => {
    if (!compositeForegroundImage || !compositeBackgroundImage) {
        alert('前景画像と背景画像の両方が必要です。');
        return;
    }

    // 合成ボタンを非表示にする
    compositeBTN.style.display = 'none';

    var formData = new FormData();
    formData.append('foreground', dataURItoBlob(compositeForegroundImage));
    formData.append('background', dataURItoBlob(compositeBackgroundImage));

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
        if (data.composite_image) {
            const compositeImageSrc = `data:image/png;base64,${data.composite_image}`;
            // ここで画像をプレビューに表示する際に、オリジナルのアスペクト比を維持する
            compositePreviewArea.innerHTML = `<img src="${compositeImageSrc}" alt="Composite Image" style="max-width: 100%; height: auto;">`;
            
            // ダウンロードボタンに合成画像のデータURLをセット
            downloadcompositeBTN.href = compositeImageSrc;
            downloadcompositeBTN.download = 'composite_image.png';
            downloadcompositeBTN.style.display = 'block';
        } else {
            alert('画像の合成に失敗しました。');
            downloadcompositeBTN.style.display = 'none';
        }
    })
    .catch(error => {
        console.error('画像合成中にエラーが発生しました:', error);
        alert('エラーが発生しました。コンソールを確認してください。');
        downloadcompositeBTN.style.display = 'none';
    });
});

// ダウンロードボタンのイベントハンドラ
downloadcompositeBTN.addEventListener('click', () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    const backgroundImg = new Image();
    backgroundImg.src = compositeBackgroundImage;

    const foregroundImg = new Image();
    foregroundImg.src = compositeForegroundImage;

    backgroundImg.onload = () => {
        canvas.width = backgroundImg.width;
        canvas.height = backgroundImg.height;

        ctx.drawImage(backgroundImg, 0, 0);

        foregroundImg.onload = () => {
            const aspectRatioForeground = foregroundImg.width / foregroundImg.height;
            let scaledWidth = canvas.width;
            let scaledHeight = canvas.width / aspectRatioForeground;

            if (scaledHeight > canvas.height) {
                scaledHeight = canvas.height;
                scaledWidth = canvas.height * aspectRatioForeground;
            }

            const offsetX = (canvas.width - scaledWidth) / 2;
            const offsetY = (canvas.height - scaledHeight) / 2;
            ctx.drawImage(foregroundImg, offsetX, offsetY, scaledWidth, scaledHeight);

            const dataURL = canvas.toDataURL('image/png');

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