// ===========================================================================

// タブを切り替える関数
function changeTab(targetId) {
    const tabs = document.getElementsByClassName("tab-content");
    for (let tabcontent of tabs) {
        tabcontent.style.display = "none";
    }

    const activeTab = document.getElementById(targetId);
    if (activeTab) {
        activeTab.style.display = "block";
    }
}

// ページ読み込み時の処理
document.addEventListener('DOMContentLoaded', () => {
    // タブ関連のイベントリスナーを設定
    document.querySelectorAll('nav a').forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            const targetId = link.getAttribute('data-target');
            changeTab(targetId);
        });
    });
    // デフォルトでホームタブを表示
    changeTab('home');
});

function toggleElements(show, ...elements) {
    elements.forEach(element => {
        element.style.display = show ? 'block' : 'none';
    });
}

// ===========================================================================
// ===========================================================================

// CSRFトークンをクッキーから取得
const csrftoken = getCookie('csrftoken');

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

// ===========================================================================
// ===========================================================================

const processingBTN = document.getElementById('processingBTN');
const downloadingBTN = document.getElementById('downloadingBTN');

// プレビューをクリアする関数
function clearPreviews() {
    const previewImages = document.querySelectorAll('.preview');
    previewImages.forEach(image => image.remove());
}

// ===========================================================================
// ===========================================================================

// HTML要素の参照
const cancelBTN = document.getElementById('cancelBTN');
const removebgDDZ = document.getElementById('removebgDDZ');
const fileInput = document.createElement('input');
const removebgBTN = document.getElementById('removebgBTN');
const downloadBTN = document.getElementById('downloadBTN');
const outputImage = document.getElementById('output_image');

toggleElements(false, cancelBTN, removebgBTN, processingBTN, downloadBTN, downloadingBTN);

// ===========================================================================

// リセットボタン
cancelBTN.addEventListener('click', resetForm);

function resetForm() {
    fileInput.value = '';
    outputImage.style.display = 'none';
    removebgDDZ.style.display = 'flex';
    toggleElements(false, cancelBTN, removebgBTN, processingBTN, downloadBTN, downloadingBTN);
    clearPreviews();
}

// ===========================================================================

// HTML要素の参照
removebgDDZ.addEventListener('dragover', handleDragOver, false);
removebgDDZ.addEventListener('drop', (e) => handleRemoveDrop(e, 'remove_aaa'));
removebgDDZ.addEventListener('click', () => fileInput.click());

function handleDragOver(e) {
    e.stopPropagation();
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
}

function handleRemoveDrop(e, type) {
    e.preventDefault();
    e.stopPropagation();
    const files = e.dataTransfer.files;
    if (files.length === 1 && files[0].type.match('image.*')) {
        processRemoveImage(files[0], type);
    } else {
        alert('画像ファイルを1つ選択してください。');
    }
}

// ファイルインプット
fileInput.type = 'file';
fileInput.accept = 'image/*';
fileInput.style.display = 'none';

// HTMLにファイルインプット要素を追加
document.body.appendChild(fileInput);

// ファイル選択イベントの処理
fileInput.addEventListener('change', (e) => {
    processRemoveFileSelect(e, 'remove_aaa');
});

function processRemoveFileSelect(e, type) {
    const files = e.target.files;
    if (files.length === 1) {
        const fileType = files[0].type;
        if (fileType === 'image/avif') {
            alert('サポートされていないファイル形式です。別の画像ファイルを選択してください。');
        } else if (fileType.match('image.*')) {
            processRemoveImage(files[0], type);
        } else {
            alert('サポートされていないファイル形式です。別の画像ファイルを選択してください。');
        }
    } else {
        alert('アップロードできる画像は1つのみです。');
    }
}

function processRemoveImage(file, type) {
    const reader = new FileReader();
    reader.onload = (e) => {
        const imageSrc = e.target.result;
        if (type === 'remove_aaa') {
            displayUploadedImage(imageSrc);
        }
    };
    reader.readAsDataURL(file);
}

// アップロードされた画像を表示する関数
function displayUploadedImage(imageSrc) {
    const imageElement = new Image();
    imageElement.onload = function() {
        let newWidth, newHeight;
        const parentWidth = removebgDDZ.offsetWidth;
        const parentHeight = removebgDDZ.offsetHeight;
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
        removebgDDZ.parentNode.insertBefore(this, removebgDDZ.nextSibling);
        removebgDDZ.style.display = 'none';
        toggleElements(true, removebgBTN, cancelBTN);
    };
    imageElement.src = imageSrc;
}

// ===========================================================================

// 背景削除
removebgBTN.addEventListener('click', () => startBackgroundRemoval(fileInput.files[0]));

function startBackgroundRemoval(file) {
    if (file) {
        const localAbortController = new AbortController();
        toggleElements(false, cancelBTN, removebgBTN);
        toggleElements(true, processingBTN);
        removeBackground(file, localAbortController);
    }
}

function removeBackground(file, abortController) {
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
        displayProcessedImage(data.image);
        downloadBTN.onclick = () => startDownload(data.image);
    })
    .catch(error => {
        if (error.name === 'AbortError') {
            console.log('Fetch aborted');
        } else {
            console.error('Error:', error);
        }
    });
}

// 背景削除後の画像を表示する関数
function displayProcessedImage(base64Data) {
    const imageElement = new Image();
    imageElement.onload = function() {
        clearPreviews();
        removebgDDZ.style.display = 'flex';

        let newWidth, newHeight;
        const parentWidth = removebgDDZ.offsetWidth;
        const parentHeight = removebgDDZ.offsetHeight;
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
        removebgDDZ.parentNode.insertBefore(this, removebgDDZ.nextSibling);
        removebgDDZ.style.display = 'none';
        toggleElements(false, processingBTN);
        toggleElements(true, downloadBTN, cancelBTN);
    };
    imageElement.src = 'data:image/png;base64,' + base64Data;
}

function startDownload(base64Data) {
    if (base64Data) {
        toggleElements(false, downloadBTN, cancelBTN);
        toggleElements(true, downloadingBTN);

        var link = document.createElement('a');
        link.href = 'data:image/png;base64,' + base64Data;
        link.download = 'processed_image.png';

        link.addEventListener('click', () => {
            setTimeout(resetForm, 2000);
        });

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

// ===========================================================================
// ===========================================================================

// HTML要素の参照
const resetCompositeButton = document.getElementById('resetCompositeButton');
const foregroundDDZ = document.getElementById('foregroundDDZ');
const backgroundDDZ = document.getElementById('backgroundDDZ');
const compositeForegroundFileInput = document.createElement('input');
const compositeBackgroundFileInput = document.createElement('input');
const compositePreviewArea = document.getElementById('composite_preview_area');
const compositeBTN = document.getElementById('compositeBTN');
const compositeprocessingBTN = document.getElementById('compositeprocessingBTN');
const downloadcompositeBTN = document.getElementById('downloadcompositeBTN');
const compositedownloadingBTN = document.getElementById('compositedownloadingBTN');

toggleElements(false, resetCompositeButton, compositeBTN, compositeprocessingBTN, downloadcompositeBTN, compositedownloadingBTN);

// ===========================================================================

// リセットボタンのイベントハンドラーをセットアップ
resetCompositeButton.addEventListener('click', resetAllImages);

// すべての画像とプレビューをリセットする関数
function resetAllImages() {
    compositeForegroundFileInput.value = ''; // ファイル入力をリセット
    compositeBackgroundFileInput.value = ''; // ファイル入力をリセット
    compositePreviewArea.innerHTML = ''; // プレビュー領域をクリア
    toggleElements(false, resetCompositeButton, compositeBTN, compositeprocessingBTN, downloadcompositeBTN, compositedownloadingBTN);
    clearPreviews();
    // resetDDZDisplay();
}

// // ドラッグ＆ドロップゾーンの表示をリセットする関数
// function resetDDZDisplay() {
//     const ddzElements = document.querySelectorAll('.compositeDDZ');
//     ddzElements.forEach(ddz => {
//         ddz.style.display = 'flex'; // デフォルト表示に戻す
//         ddz.innerHTML = 'ドラッグ＆ドロップ<br>または<br>クリックで画像選択'; // デフォルトテキストに戻す
//     });
// }

// ===========================================================================

// ファイルインプット要素の作成
compositeForegroundFileInput.type = 'file';
compositeForegroundFileInput.accept = 'image/*';
compositeForegroundFileInput.style.display = 'none';

compositeBackgroundFileInput.type = 'file';
compositeBackgroundFileInput.accept = 'image/*';
compositeBackgroundFileInput.style.display = 'none';

// HTMLにファイルインプット要素を追加
document.body.appendChild(compositeForegroundFileInput);
document.body.appendChild(compositeBackgroundFileInput);

// クリックイベントでファイル選択ダイアログを開くように設定
foregroundDDZ.addEventListener('dragover', handleDragOver, false);
foregroundDDZ.addEventListener('drop', (e) => handleCompositeDrop(e, 'foreground'));
foregroundDDZ.addEventListener('click', () => compositeForegroundFileInput.click());

backgroundDDZ.addEventListener('dragover', handleDragOver, false);
backgroundDDZ.addEventListener('drop', (e) => handleCompositeDrop(e, 'background'));
backgroundDDZ.addEventListener('click', () => compositeBackgroundFileInput.click());

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
compositeForegroundFileInput.addEventListener('change', (e) => {
    processCompositeFileSelect(e, 'foreground');
});
compositeBackgroundFileInput.addEventListener('change', (e) => {
    processCompositeFileSelect(e, 'background');
});

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

function processCompositeImage(file, type) {
    const reader = new FileReader();
    reader.onload = (e) => {
        const imageSrc = e.target.result;
        if (type === 'foreground') {
            updateDDZDisplay(foregroundDDZ, imageSrc, 'foreground');
        } else if (type === 'background') {
            updateDDZDisplay(backgroundDDZ, imageSrc, 'background');
        }
        updateCompositeButtonVisibility();
    };
    reader.readAsDataURL(file);
}

// DDZ表示更新関数
function updateDDZDisplay(DDZElement, imageSrc) {
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

// 画像合成ボタンの表示制御関数
function updateCompositeButtonVisibility() {
    const foregroundImage = compositeForegroundFileInput.files[0];
    const backgroundImage = compositeBackgroundFileInput.files[0];
    if (foregroundImage && backgroundImage) {
        toggleElements(true, compositeBTN);
    } else {
        toggleElements(false, compositeBTN);
    }
    // リセットボタンの表示状態もここで制御
    resetCompositeButton.style.display = (foregroundImage || backgroundImage) ? 'block' : 'none';
}

// ===========================================================================

// 画像合成ボタンのイベントハンドラ
compositeBTN.addEventListener('click', () => {
    const foregroundFile = compositeForegroundFileInput.files[0];
    const backgroundFile = compositeBackgroundFileInput.files[0];
    if (!foregroundFile || !backgroundFile) {
        alert('前景画像と背景画像の両方が必要です。');
        return;
    }

    // 合成ボタンを非表示にし、処理中状態を表示する
    toggleElements(false, compositeBTN, resetCompositeButton);
    toggleElements(true, compositeprocessingBTN);

    // FormDataオブジェクトを作成し、ファイルを追加
    var formData = new FormData();
    formData.append('foreground', foregroundFile);
    formData.append('background', backgroundFile);

    // サーバーに対して合成を要求
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
            compositePreviewArea.innerHTML = `<img src="${compositeImageSrc}" alt="Composite Image" style="max-width: 100%; height: auto;">`;
            downloadcompositeBTN.href = compositeImageSrc;
            downloadcompositeBTN.download = 'composite_image.png';
            toggleElements(false, compositeprocessingBTN);
            toggleElements(true, resetCompositeButton, downloadcompositeBTN);
        } else {
            alert('画像の合成に失敗しました。');
            resetAllImages();
        }
    })
    .catch(error => {
        console.error('画像合成中にエラーが発生しました:', error);
        alert('エラーが発生しました。コンソールを確認してください。');
        resetAllImages();
    });
});

// ===========================================================================

// ダウンロードボタンのイベントハンドラ
downloadcompositeBTN.addEventListener('click', (event) => {
    event.preventDefault(); // デフォルトの動作を停止する

    // ダウンロードボタンの表示状態を更新
    toggleElements(false, downloadcompositeBTN, resetCompositeButton);
    toggleElements(true, compositedownloadingBTN);

    // 背景画像と前景画像をCanvasに描画してダウンロード
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const backgroundImg = new Image();
    const foregroundImg = new Image();

    // 画像の読み込みがCORSによる制限を受けないようにする
    backgroundImg.crossOrigin = 'Anonymous';
    foregroundImg.crossOrigin = 'Anonymous';

    backgroundImg.onload = () => {
        // 背景画像が読み込まれたらCanvasのサイズを設定
        canvas.width = backgroundImg.width;
        canvas.height = backgroundImg.height;
        ctx.drawImage(backgroundImg, 0, 0);

        foregroundImg.onload = () => {
            // 前景画像を描画
            ctx.drawImage(foregroundImg, 0, 0);
            // Canvasから画像のDataURLを取得
            const dataURL = canvas.toDataURL('image/png');
            triggerDownload(dataURL, 'composite_image.png');
            setTimeout(resetAllImages, 1000);
        };
        // 前景画像の読み込みを開始
        foregroundImg.src = compositePreviewArea.querySelector('img').src;
    };
    // 背景画像の読み込みを開始
    backgroundImg.src = compositePreviewArea.querySelector('img').src;
});

// ダウンロードをトリガーする関数
function triggerDownload(dataURL, filename) {
    const downloadLink = document.createElement('a');
    downloadLink.href = dataURL;
    downloadLink.download = filename;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
}

function downloadLink(href, filename) {
    const downloadLink = document.createElement('a');
    downloadLink.href = href;
    downloadLink.download = filename;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);

    // ダウンロードボタンとリセットボタンを元に戻す
    toggleElements(true, resetCompositeButton);
    toggleElements(false, compositedownloadingBTN);
}

// ===========================================================================