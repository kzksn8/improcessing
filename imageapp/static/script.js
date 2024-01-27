// ===========================================================================
// HTML要素の参照
// ===========================================================================

const [us_slider, us_input_ddz, us_reset_btn, us_process_btn, us_processing_btn, us_download_btn, us_downloading_btn] = getElements('us');
const [rb_slider, rb_input_ddz, rb_reset_btn, rb_process_btn, rb_processing_btn, rb_download_btn, rb_downloading_btn] = getElements('rb');

function getElements(prefix) {
    const suffixes = ['slider', 'input_ddz', 'reset_btn', 'process_btn', 'processing_btn', 'download_btn', 'downloading_btn'];
    return suffixes.map(suffix => document.getElementById(`${prefix}_${suffix}`));
}

// ===========================================================================
// 画像インプットの関数
// ===========================================================================

const us_input = setupInput('file', 'image/*', 'none');
const rb_input = setupInput('file', 'image/*', 'none');

function setupInput(type, accept, display) {
    const input  = document.createElement('input');
    input.type   = type;
    input.accept = accept;
    input.style.display = display;
    return input;
}

// ===========================================================================
// タブ切替時の処理
// ===========================================================================

let isProcessing = false; // 処理中かどうかの状態を保持

// ページ読み込み時の処理
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('nav a').forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            const targetId = link.getAttribute('data-target');
            changeTab(targetId);
        });
    });
    changeTab('home'); // デフォルトでホームタブを表示
    window.addEventListener('beforeunload', function (e) {
        // 処理中の場合、警告メッセージを表示
        if (isProcessing) {
            var confirmationMessage = 'このページを離れると、処理が中止されます。本当にページを離れますか？';
            (e || window.event).returnValue = confirmationMessage;
            return confirmationMessage;
        }
    });
});

function changeTab(targetId) {
    if (isProcessing) {
        // キャンセルを選択した場合、処理を続行
        if (!confirm('このページを離れると、処理が中止されます。本当にページを離れますか？')) {  
            return;
        // OKを選択した場合、処理を中止
        } else {
            if (document.getElementById('us_reset_btn')) {
                setupReset('us');
            }
            if (document.getElementById('rb_reset_btn')) {
                setupReset('rb');
            }
            isProcessing = false;
        }
    }
    const tabs = document.getElementsByClassName("content-init");
    for (let tabcontent of tabs) {
        tabcontent.style.display = "none";
    }
    const activeTab = document.getElementById(targetId);
    if (activeTab) {
        activeTab.style.display = "block";
    }
}

// ===========================================================================
// スライダーの処理
// ===========================================================================

window.onload = function() {
    initializeSlider('upscale-container', 'us_slider');
    initializeSlider('removebg-container', 'rb_slider');
};

function initializeSlider(containerClass, sliderId) {
    const container = document.querySelector(`.${containerClass}`);
    const beforeImage = container.querySelector('.before-image');
    const afterImage = container.querySelector('.after-image');
    const slider = container.querySelector(`#${sliderId}`);

    slider.oninput = function() {
        const sliderValue = this.value;
        beforeImage.style.clipPath = `inset(0 ${100 - sliderValue}% 0 0)`;
        afterImage.style.clipPath = `inset(0 0 0 ${sliderValue}%)`;
    };
}

// ===========================================================================
// ボタン表示の処理
// ===========================================================================

function btnDisplayUpdate(show, ...elements) {
    elements.forEach(element => {
        element.style.display = show ? 'block' : 'none';
    });
}

// ===========================================================================
// プレビュー画面表示の処理
// ===========================================================================

function ddzDisplayUpdate(ddzElement, imageSrc, prefix, buttonAddon) {
    ddzElement.querySelector('img.preview')?.remove();

    const imageElement = new Image();
    imageElement.onload = function() {
        ddzElement.style.display = 'flex';

        let newWidth, newHeight;
        const parentWidth  = ddzElement.offsetWidth;
        const parentHeight = ddzElement.offsetHeight;
        const aspectRatio  = this.width / this.height;

        if (parentWidth / parentHeight > aspectRatio) {
            newHeight = parentHeight;
            newWidth  = aspectRatio * newHeight;
        } else {
            newWidth  = parentWidth;
            newHeight = newWidth / aspectRatio;
        }

        this.style.width  = newWidth + 'px';
        this.style.height = newHeight + 'px';
        this.className    = 'preview';

        document.querySelectorAll(`#${prefix} .preview`).forEach(img => img.remove());
        ddzElement.parentNode.insertBefore(this, ddzElement.nextSibling);
        ddzElement.style.display = 'none';
        buttonAddon();
    };
    imageElement.src = imageSrc;
}

// ===========================================================================
// 画像アップロードの処理
// ===========================================================================

setupInputFiles(us_input_ddz, us_input, 'us');
setupInputFiles(rb_input_ddz, rb_input, 'rb');

function setupInputFiles(element, input, prefix) {
    element.addEventListener('dragover', handleDragOver, false);
    element.addEventListener('dragleave', handleDragLeave, false);
    element.addEventListener('drop', (e) => handleDrop(e, element, input, prefix), false);
    element.addEventListener('click', () => {
        input.value = '';
        input.click();
    });
    input.addEventListener('change', (e) => handleFileSelect(e, input, prefix));
}

// 画像ドラッグ時の処理
function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
    e.currentTarget.classList.add('dragover');
}

// 画像ドラッグ終了後の処理
function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('dragover');
}

// 画像ドロップ時の処理
function handleDrop(e, element, input, prefix) {
    e.preventDefault();
    e.stopPropagation();
    element.classList.remove('dragover');
    processFiles(e.dataTransfer.files, input, prefix);
}

// 画像クリック時の処理
function handleFileSelect(e, input, prefix) {
    processFiles(e.target.files, input, prefix);
}

// ファイル処理のロジック
function processFiles(files, input, prefix) {
    if (files.length === 1) {
        const fileType = files[0].type;
        
        // createFileListをprocessFiles内に移動
        const createFileList = (file) => {
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            return dataTransfer.files;
        };

        if (fileType === 'image/avif' || !fileType.match('image.*')) {
            alert('サポートされていないファイル形式です。別の画像ファイルを選択してください。');
        } else {
            processImageFiles(files[0], prefix);
            input.files = createFileList(files[0]);
        }
    } else {
        alert('アップロードできる画像は1つです。');
    }
}

// ファイル処理のロジック
function processImageFiles(file, prefix) {
    const reader = new FileReader();
    reader.onload = (e) => {
        const imageSrc = e.target.result;
        const [, input_ddz, reset_btn, process_btn, , , ] = getElements(prefix);
        ddzDisplayUpdate(input_ddz, imageSrc, prefix, function() {
            btnDisplayUpdate(true, process_btn, reset_btn);
        });
    };
    reader.readAsDataURL(file);
}

// ===========================================================================
// 画像にviews.pyの処理を適用してダウンロード
// ===========================================================================

setupProcessButton('us', 'upscale-image/', us_input);
setupProcessButton('rb', 'remove-background/', rb_input);

// 処理実行ボタンを押したときのロジック
function setupProcessButton(prefix, url, input) {
    const [, input_ddz, reset_btn, process_btn, processing_btn, download_btn, downloading_btn] = getElements(prefix);
    
    process_btn.addEventListener('click', () => {
        isProcessing = true;
        
        const file = input ? input.files[0] : null;
        if (!file) {
            alert('画像のアップロードが必要です。');
            return;
        }
        btnDisplayUpdate(false, process_btn, reset_btn);
        btnDisplayUpdate(true, processing_btn);

        var formData = new FormData();
        formData.append('image', file);

        const csrftoken = getCookie('csrftoken');
        fetch(url, {
            method: 'POST',
            body: formData,
            headers: {
                'X-CSRFToken': csrftoken
            }
        })
        .then(handleErrors)
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok.');
            return response.json();
        })
        .then(data => {
            if (data && data.image) {
                const base64Data = data.image.startsWith('data:image/png;base64,') ?data.image : 'data:image/png;base64,' + data.image;
                ddzDisplayUpdate(input_ddz, base64Data, prefix, () => {
                    btnDisplayUpdate(false, processing_btn);
                    btnDisplayUpdate(true, download_btn, reset_btn);
                });
                download_btn.onclick = () => startDownload(base64Data, prefix, () => {
                    btnDisplayUpdate(false, download_btn, reset_btn);
                    btnDisplayUpdate(true, downloading_btn);
                });
            } else {
                throw new Error(data && data.error ? data.error : "不明なエラーが発生しました。");
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert(`エラーが発生しました: ${error.message}`);
            setupReset(prefix);
        })
        .finally(() => {
            isProcessing = false;
        });
    });
}

// クッキーから特定の名前の値を取得
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

// HTTPリクエストのレスポンスを処理
function handleErrors(response) {
    if (!response.ok) {
        const clonedResponse = response.clone();
        clonedResponse.text().then(text => {
            console.error('Error response text:', text);
            alert('エラーが発生しました。: ' + text);
        });
        throw Error(`HTTP error: ${response.status} ${response.statusText}`);
    }
    return response;
}

// ダウンロードボタンを押したときのロジック
function startDownload(base64Data, prefix, buttonAddon) {
    if (base64Data) {
        buttonAddon();
        // Base64データをBlobに変換
        const byteCharacters = atob(base64Data.split(',')[1]);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }

        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], {type: 'image/png'});

        // Blobを使用してObject URLを作成
        const url = URL.createObjectURL(blob);

        // ダウンロードリンクを設定
        const link = document.createElement('a');
        link.href = url;
        link.download = 'processed_image.png';
        link.addEventListener('click', () => {
            setTimeout(() => {
                URL.revokeObjectURL(url); // メモリリークを防ぐために使用後にURLを解放
                setupReset(prefix);
            }, 1000);
        });

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

// ===========================================================================
// 初期状態に戻す処理
// ===========================================================================

us_reset_btn.addEventListener('click', () => setupReset('us'));
rb_reset_btn.addEventListener('click', () => setupReset('rb'));

// リセットボタンを押したときのロジック
function setupReset(prefix) {
    isProcessing = false;

    document.querySelectorAll(`#${prefix} .preview`).forEach(img => img.remove());

    const inputElement = document.getElementById(`${prefix}_input`);
    if (inputElement) {
        inputElement.value = '';
    }
    
    const inputDdzElement = document.getElementById(`${prefix}_input_ddz`);
    if (inputDdzElement) {
        inputDdzElement.style.display = 'flex';
    }

    const buttonsAndIndicators = [
        `${prefix}_reset_btn`,
        `${prefix}_process_btn`,
        `${prefix}_processing_btn`,
        `${prefix}_download_btn`,
        `${prefix}_downloading_btn`
    ];

    buttonsAndIndicators.forEach(elementId => {
        const element = document.getElementById(elementId);
        if (element) {
            element.style.display = 'none';
        }
    });
}

// ===========================================================================