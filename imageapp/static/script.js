// ===========================================================================

// ページ読み込み時の処理
document.addEventListener('DOMContentLoaded', () => {
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

function toggleElements(show, ...elements) {
    elements.forEach(element => {
        element.style.display = show ? 'block' : 'none';
    });
}

// ===========================================================================

// HTML要素の参照
const resetCompositeButton = document.getElementById('st_reset_btn');
const foregroundDDZ = document.getElementById('st_input_img_content_ddz');
const backgroundDDZ = document.getElementById('st_input_img_style_ddz');
const compositeBTN = document.getElementById('st_process_btn');
const compositeprocessingBTN = document.getElementById('st_processing_btn');
const downloadcompositeBTN = document.getElementById('st_download_btn');
const compositedownloadingBTN = document.getElementById('st_downloading_btn');
const compositePreviewArea = document.getElementById('st_output_img_prev');

toggleElements(false, resetCompositeButton, compositeBTN, compositeprocessingBTN, downloadcompositeBTN, compositedownloadingBTN);

// ===========================================================================

// HTML要素の参照
const cancelBTN = document.getElementById('rb_reset_btn');
const removebgDDZ = document.getElementById('rb_imput_img_ddz');
const removebgBTN = document.getElementById('rb_process_btn');
const processingBTN = document.getElementById('rb_processing_btn');
const downloadBTN = document.getElementById('rb_download_btn');
const downloadingBTN = document.getElementById('rb_downloading_btn');

toggleElements(false, cancelBTN, removebgBTN, processingBTN, downloadBTN, downloadingBTN);

// ===========================================================================

resetCompositeButton.addEventListener('click', resetAllImages);
cancelBTN.addEventListener('click', resetAllImages);

function resetAllImages() {
    compositeForegroundFileInput.value = '';
    compositeBackgroundFileInput.value = '';
    foregroundDDZ.style.display = 'flex';
    backgroundDDZ.style.display = 'flex';
    compositePreviewArea.innerHTML = '';
    fileInput.value = '';
    removebgDDZ.style.display = 'flex';
    toggleElements(false, resetCompositeButton, compositeBTN, compositeprocessingBTN, downloadcompositeBTN, compositedownloadingBTN);
    toggleElements(false, cancelBTN, removebgBTN, processingBTN, downloadBTN, downloadingBTN);
    const previewImages = document.querySelectorAll('.preview');
    previewImages.forEach(image => image.remove());
}

// function resetAllImages() {
//     compositeForegroundFileInput.value = '';
//     compositeBackgroundFileInput.value = '';
//     foregroundDDZ.style.display = 'flex';
//     backgroundDDZ.style.display = 'flex';
//     compositePreviewArea.innerHTML = '';
//     toggleElements(false, resetCompositeButton, compositeBTN, compositeprocessingBTN, downloadcompositeBTN, compositedownloadingBTN);
//     compositeclearPreviews();
// }

// function compositeclearPreviews() {
//     const previewImages = document.querySelectorAll('.preview');
//     previewImages.forEach(image => image.remove());
// }

// function resetForm() {
//     fileInput.value = '';
//     removebgDDZ.style.display = 'flex';
//     toggleElements(false, cancelBTN, removebgBTN, processingBTN, downloadBTN, downloadingBTN);
//     clearPreviews();
// }

// function clearPreviews() {
//     const previewImages = document.querySelectorAll('.preview');
//     previewImages.forEach(image => image.remove());
// }

// ===========================================================================

const compositeForegroundFileInput = createInput('file', 'image/*', 'none');
const compositeBackgroundFileInput = createInput('file', 'image/*', 'none');
const fileInput = createInput('file', 'image/*', 'none');

function createInput(type, accept, display) {
    const input = document.createElement('input');
    input.type = type;
    input.accept = accept;
    input.style.display = display;
    return input;
}

// ===========================================================================

// HTML要素の参照
setupDragAndDrop(foregroundDDZ, compositeForegroundFileInput, 'foreground');
setupDragAndDrop(backgroundDDZ, compositeBackgroundFileInput, 'background');
setupDragAndDrop(removebgDDZ, fileInput, 'remove_aaa');

function setupDragAndDrop(element, input, type) {
    if (element) {
        element.addEventListener('dragover', handleDragOver, false);
        element.addEventListener('drop', (e) => handleDrop(e, type));
        element.addEventListener('click', () => input.click());
    } else {
        console.error('Element not found for setupDragAndDrop:', type);
    }
}

function handleDragOver(e) {
    // デフォルトの処理をキャンセル
    e.preventDefault();  
    // ドロップ時のカーソルスタイルをコピーに設定
    e.dataTransfer.dropEffect = 'copy';
}

function handleDrop(e, type) {
    e.preventDefault();
    e.stopPropagation();
    const files = e.dataTransfer.files;
    if (files.length === 1 && files[0].type.match('image.*')) {
        processImage(files[0], type);
    } else {
        alert('画像ファイルを1つ選択してください。');
    }
}

// ===========================================================================

setupAndProcessFileSelect(compositeForegroundFileInput, 'foreground');
setupAndProcessFileSelect(compositeBackgroundFileInput, 'background');
setupAndProcessFileSelect(fileInput, 'remove_aaa');

function setupAndProcessFileSelect(input, type) {
    input.addEventListener('change', (e) => {
        const files = e.target.files;
        if (files.length === 1) {
            const fileType = files[0].type;
            if (fileType === 'image/avif') {
                alert('サポートされていないファイル形式です。別の画像ファイルを選択してください。');
            } else if (fileType.match('image.*')) {
                processImage(files[0], type);
            } else {
                alert('サポートされていないファイル形式です。別の画像ファイルを選択してください。');
            }
        } else {
            alert('アップロードできる画像は1つのみです。');
        }
    });
}

// ===========================================================================

function processImage(file, type) {
    const reader = new FileReader();
    reader.onload = (e) => {
        const imageSrc = e.target.result;
        if (type === 'foreground') {
            updateDDZDisplay(foregroundDDZ, imageSrc, function() {
                updateCompositeButtonVisibility();
            });
        } else if (type === 'background') {
            updateDDZDisplay(backgroundDDZ, imageSrc, function() {
                updateCompositeButtonVisibility();
            });
        } else if (type === 'remove_aaa') {
            updateDDZDisplay(removebgDDZ, imageSrc, function() {
                toggleElements(true, removebgBTN, cancelBTN);
            });
        }
    };
    reader.readAsDataURL(file);
}

function updateDDZDisplay(DDZElement, imageSrc, additionalOnload) {
    const existingImage = DDZElement.querySelector('img.preview');
    if (existingImage) {
        DDZElement.removeChild(existingImage);
    }

    const imageElement = new Image();
    imageElement.onload = function() {
        DDZElement.style.display = 'flex';

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

        if (additionalOnload) additionalOnload();
    };
    imageElement.src = imageSrc;
}

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

// CSRFトークンをクッキーから取得し、クッキーから特定の名前の値を取得
const csrftoken = getCookie('csrftoken');
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
    updateDDZDisplay(compositePreviewArea, 'data:image/png;base64,' + base64Data, function() {
        toggleElements(false, compositeprocessingBTN);
        toggleElements(true, downloadcompositeBTN, resetCompositeButton);
    });
}

// ===========================================================================

removebgBTN.addEventListener('click', () => {
    const file = fileInput.files[0];
    if (file) {
        // AbortControllerのインスタンスを作成
        const abortController = new AbortController();
        // 必要な要素の表示状態を切り替え
        toggleElements(false, cancelBTN, removebgBTN);
        toggleElements(true, processingBTN);

        // ファイルをFormDataオブジェクトに追加
        var formData = new FormData();
        formData.append('image', file);

        // サーバーにPOSTリクエストを送信
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
            // 処理された画像を表示し、ダウンロードボタンにイベントを設定
            displayProcessedImage(data.image);
            downloadBTN.onclick = () => startDownload(data.image);
        })
        .catch(error => {
            // エラーハンドリング
            if (error.name === 'AbortError') {
                console.log('Fetch aborted');
            } else {
                console.error('Error:', error);
            }
        });
    }
});

// 背景削除後の画像を表示
function displayProcessedImage(base64Data) {
    updateDDZDisplay(removebgDDZ, 'data:image/png;base64,' + base64Data, function() {
        toggleElements(false, processingBTN);
        toggleElements(true, downloadBTN, cancelBTN);
    });
}

// ===========================================================================

startDownload(base64Data, [downloadBTN, cancelBTN], [downloadingBTN], resetForm);
startDownload(base64Data, [downloadcompositeBTN, resetCompositeButton], [compositedownloadingBTN], resetAllImages);

function startDownload(base64Data, elementsToHide, elementsToShow, callback) {
    if (base64Data) {
        toggleElements(false, ...elementsToHide);
        toggleElements(true, ...elementsToShow);

        const link = document.createElement('a');
        link.href = `data:image/png;base64,${base64Data}`;
        link.download = 'processed_image.png';
        
        link.addEventListener('click', () => setTimeout(callback, 1000));
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

// ===========================================================================