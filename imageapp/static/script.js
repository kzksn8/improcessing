// ===========================================================================

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
    changeTab('home');  // デフォルトでホームタブを表示
});

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

// ===========================================================================
// ===========================================================================

const csrftoken = getCookie('csrftoken');  // CSRFトークンをクッキーから取得
const processingBTN = document.getElementById('processingBTN');
const downloadingBTN = document.getElementById('downloadingBTN');

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

function clearPreviews() {
    const previewImages = document.querySelectorAll('.preview');
    previewImages.forEach(image => image.remove());
}

function toggleElements(show, ...elements) {
    elements.forEach(element => {
        element.style.display = show ? 'block' : 'none';
    });
}

function handleErrors(response) {
    if (!response.ok) {
        const clonedResponse = response.clone();
        // エラーレスポンスの内容をログに出力するためにJSONを解析
        clonedResponse.json().then(json => {
            console.error('Error response JSON:', json);
            alert('エラーが発生しました: ' + (json.error || '不明なエラー'));
        }).catch(() => {
            // JSONの解析に失敗した場合は、テキストとして出力
            clonedResponse.text().then(text => {
                console.error('Error response text:', text);
                alert('エラーが発生しました: ' + text);
            });
        });
        throw Error(`HTTP error: ${response.status} ${response.statusText}`);
    }
    return response;
}

// ===========================================================================
// ===========================================================================

// HTML要素の参照
const resetCompositeButton = document.getElementById('resetCompositeButton');
const foregroundDDZ = document.getElementById('foregroundDDZ');
const backgroundDDZ = document.getElementById('backgroundDDZ');
const compositeForegroundFileInput = document.createElement('input');
const compositeBackgroundFileInput = document.createElement('input');
const compositeBTN = document.getElementById('compositeBTN');
const compositeprocessingBTN = document.getElementById('compositeprocessingBTN');
const downloadcompositeBTN = document.getElementById('downloadcompositeBTN');
const compositedownloadingBTN = document.getElementById('compositedownloadingBTN');
const compositePreviewArea = document.getElementById('composite_preview_area');

toggleElements(false, resetCompositeButton, compositeBTN, compositeprocessingBTN, downloadcompositeBTN, compositedownloadingBTN);

// ===========================================================================

// リセットボタンのイベントハンドラーをセットアップ
resetCompositeButton.addEventListener('click', resetAllImages);

// すべての画像とプレビューをリセットする関数
function resetAllImages() {
    compositeForegroundFileInput.value = '';
    compositeBackgroundFileInput.value = '';
    foregroundDDZ.style.display = 'flex';
    backgroundDDZ.style.display = 'flex';
    compositePreviewArea.innerHTML = '';
    toggleElements(false, resetCompositeButton, compositeBTN, compositeprocessingBTN, downloadcompositeBTN, compositedownloadingBTN);
    clearPreviews();
}

// ===========================================================================

foregroundDDZ.addEventListener('dragover', handleDragOver, false);
foregroundDDZ.addEventListener('drop', (e) => handleCompositeDrop(e, 'foreground'));
foregroundDDZ.addEventListener('click', () => compositeForegroundFileInput.click());

backgroundDDZ.addEventListener('dragover', handleDragOver, false);
backgroundDDZ.addEventListener('drop', (e) => handleCompositeDrop(e, 'background'));
backgroundDDZ.addEventListener('click', () => compositeBackgroundFileInput.click());

compositeForegroundFileInput.type = 'file';
compositeForegroundFileInput.accept = 'image/*';
compositeForegroundFileInput.style.display = 'none';
compositeForegroundFileInput.addEventListener('change', (e) => {
    processCompositeFileSelect(e, 'foreground');
});

compositeBackgroundFileInput.type = 'file';
compositeBackgroundFileInput.accept = 'image/*';
compositeBackgroundFileInput.style.display = 'none';
compositeBackgroundFileInput.addEventListener('change', (e) => {
    processCompositeFileSelect(e, 'background');
});

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
    resetCompositeButton.style.display = (foregroundImage || backgroundImage) ? 'block' : 'none';
}

// ===========================================================================

compositeBTN.addEventListener('click', () => {
    const foregroundFile = compositeForegroundFileInput.files[0];
    const backgroundFile = compositeBackgroundFileInput.files[0];

    // エラーチェック: ファイルが選択されているかどうか
    if (!foregroundFile || !backgroundFile) {
        alert('前景画像と背景画像の両方が必要です。');
        return;
    }

    // 合成ボタンを非表示にし、処理中状態を表示する
    toggleElements(false, compositeBTN, resetCompositeButton);
    toggleElements(true, compositeprocessingBTN);

    // FormDataオブジェクトを作成し、ファイルを追加
    var formData = new FormData();
    formData.append('content_img', foregroundFile);
    formData.append('style_img', backgroundFile);

    // サーバーに対して合成を要求
    fetch('style_transfer_view/', {
        method: 'POST',
        body: formData,
        headers: {
            'X-CSRFToken': csrftoken
        }
    })
    .then(handleErrors)
    .then(response => response.json())
    .then(data => {
        // レスポンスの検証: サーバーからのレスポンスに 'image' プロパティが含まれているか
        if (data && data.image) {
            // 画像を表示
            compositedisplayProcessedImage(data.image);
            downloadcompositeBTN.onclick = () => compositestartDownload(data.image);
        } else {
            // エラーハンドリング: 適切なエラーメッセージをユーザーに通知
            alert('画像の合成に失敗しました。' + (data && data.error ? data.error : "不明なエラーが発生しました。"));
            resetAllImages();
        }
    })
    .catch(error => {
    // ネットワークエラーまたはその他のエラーのハンドリング
    console.error('画像合成中にエラーが発生しました:', error);
    alert('エラーが発生しました。コンソールを確認してください。');
    resetAllImages();
    });
});

function compositedisplayProcessedImage(base64Data) {
    AAAcreateAndDisplayImage('data:image/png;base64,' + base64Data, function() {
        toggleElements(false, compositeprocessingBTN);
        toggleElements(true, downloadcompositeBTN, resetCompositeButton);
    });
}

// 新しい画像要素を作成し、サイズを調整して表示する関数
function AAAcreateAndDisplayImage(imageSrc, additionalOnload) {
    const imageElement = new Image();
    imageElement.onload = function() {
        compositePreviewArea.style.display = 'flex';

        let newWidth, newHeight;
        const parentWidth = compositePreviewArea.offsetWidth;
        const parentHeight = compositePreviewArea.offsetHeight;
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
        compositePreviewArea.parentNode.insertBefore(this, compositePreviewArea.nextSibling);
        compositePreviewArea.style.display = 'none';

        if (additionalOnload) additionalOnload();
    };
    imageElement.src = imageSrc;
}

// ===========================================================================

function compositestartDownload(base64Data) {
    if (base64Data) {
        toggleElements(false, downloadcompositeBTN, resetCompositeButton);
        toggleElements(true, compositedownloadingBTN);

        var link = document.createElement('a');
        link.href = 'data:image/png;base64,' + base64Data;
        link.download = 'processed_image.png';

        link.addEventListener('click', () => {
            setTimeout(resetAllImages, 1000);
        });

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

// ===========================================================================
// ===========================================================================

// 新しい画像要素を作成し、サイズを調整して表示する関数
function createAndDisplayImage(imageSrc, additionalOnload) {
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

        if (additionalOnload) additionalOnload();
    };
    imageElement.src = imageSrc;
}

// ===========================================================================
// ===========================================================================

// HTML要素の参照
const cancelBTN = document.getElementById('cancelBTN');
const removebgDDZ = document.getElementById('removebgDDZ');
const fileInput = document.createElement('input');
const removebgBTN = document.getElementById('removebgBTN');
const downloadBTN = document.getElementById('downloadBTN');

toggleElements(false, cancelBTN, removebgBTN, processingBTN, downloadBTN, downloadingBTN);

// ===========================================================================

// リセットボタン
cancelBTN.addEventListener('click', resetForm);

function resetForm() {
    fileInput.value = '';
    removebgDDZ.style.display = 'flex';
    toggleElements(false, cancelBTN, removebgBTN, processingBTN, downloadBTN, downloadingBTN);
    clearPreviews();
}

// ===========================================================================

// HTML要素の参照
removebgDDZ.addEventListener('dragover', handleDragOver, false);
removebgDDZ.addEventListener('drop', (e) => handleRemoveDrop(e, 'remove_aaa'));
removebgDDZ.addEventListener('click', () => fileInput.click());

// ファイルインプット
fileInput.type = 'file';
fileInput.accept = 'image/*';
fileInput.style.display = 'none';
fileInput.addEventListener('change', (e) => {
    processRemoveFileSelect(e, 'remove_aaa');
});

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
    createAndDisplayImage(imageSrc, function() {
        toggleElements(true, removebgBTN, cancelBTN);
    });
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
    createAndDisplayImage('data:image/png;base64,' + base64Data, function() {
        toggleElements(false, processingBTN);
        toggleElements(true, downloadBTN, cancelBTN);
    });
}

function startDownload(base64Data) {
    if (base64Data) {
        toggleElements(false, downloadBTN, cancelBTN);
        toggleElements(true, downloadingBTN);

        var link = document.createElement('a');
        link.href = 'data:image/png;base64,' + base64Data;
        link.download = 'processed_image.png';

        link.addEventListener('click', () => {
            setTimeout(resetForm, 1000);
        });

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

// ===========================================================================