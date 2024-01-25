// ===========================================================================

// 処理中かどうかの状態を保持
let isProcessing = false;

// ページ読み込み時の処理
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('nav a').forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            const targetId = link.getAttribute('data-target');
            changeTab(targetId);
        });
    });
    changeTab('home');  // デフォルトでホームタブを表示

    // ページを離れる前に確認する
    window.addEventListener('beforeunload', function (e) {
        // 処理中の場合、警告メッセージを表示
        if (isProcessing) {
            var confirmationMessage = 'このページを離れると、処理が中止されます。本当にページを離れますか？';
            (e || window.event).returnValue = confirmationMessage;
            return confirmationMessage;
        }
    });
});

// タブを切り替える関数
function changeTab(targetId) {
    // 処理中であれば警告を出す
    if (isProcessing) {
        if (!confirm('このページを離れると、処理が中止されます。本当にページを離れますか？')) {
            // ユーザーがキャンセルを選択した場合、処理を続行
            return;
        } else {
            // ユーザーがOKを選択した場合、処理を中止
            setupReset_us();
            isProcessing = false;
        }
    }
    updateTabDisplay(targetId);
}

function updateTabDisplay(targetId) {
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

// ページの読み込みが完了したらスライダーを初期化
window.onload = function() {
    initializeSlider('upscale-container', 'us_slider');
    initializeSlider('removebg-container', 'rb_slider');
};

// スライダーの初期化関数
function initializeSlider(containerClass, sliderId) {
    const container = document.querySelector(`.${containerClass}`);
    const beforeImage = container.querySelector('.before-image');
    const afterImage = container.querySelector('.after-image');
    const slider = container.querySelector(`#${sliderId}`);
  
    // スライダーの値が変更されたときのイベントリスナー
    slider.oninput = function() {
        const sliderValue = this.value;
        // before-imageの表示範囲をスライダーの値に応じて変更
        beforeImage.style.clipPath = `inset(0 ${100 - sliderValue}% 0 0)`;
        // after-imageの表示範囲をスライダーの値に応じて変更
        afterImage.style.clipPath = `inset(0 0 0 ${sliderValue}%)`;
    };
}

// ===========================================================================

// HTML要素の参照
const us_html_ids = ['us_slider', 'us_input_ddz', 'us_reset_btn', 'us_process_btn',
                     'us_processing_btn', 'us_download_btn', 'us_downloading_btn'];

const [us_slider, us_input_ddz, us_reset_btn, us_process_btn,
       us_processing_btn, us_download_btn, us_downloading_btn]
       = us_html_ids.map(id => document.getElementById(id));

const rb_html_ids = ['rb_slider', 'rb_input_ddz', 'rb_reset_btn', 'rb_process_btn',
                     'rb_processing_btn', 'rb_download_btn', 'rb_downloading_btn'];

const [rb_slider, rb_input_ddz, rb_reset_btn, rb_process_btn,
       rb_processing_btn, rb_download_btn, rb_downloading_btn]
       = rb_html_ids.map(id => document.getElementById(id));

// ===========================================================================

function btnDisplayUpdate(show, ...elements) {
    elements.forEach(element => {
        element.style.display = show ? 'block' : 'none';
    });
}

// ===========================================================================

function ddzDisplayUpdate(ddzElement, imageSrc, btnAddOn, resetAddOn) {
    const UploadImage = ddzElement.querySelector('img.preview');
    if (UploadImage) {
        ddzElement.removeChild(UploadImage);
    }

    const imageElement = new Image();
    imageElement.onload = function() {
        if (resetAddOn) resetAddOn();
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

        ddzElement.parentNode.insertBefore(this, ddzElement.nextSibling);
        ddzElement.style.display = 'none';

        btnAddOn();
    };
    imageElement.src = imageSrc;
}

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

setupInputFiles(us_input_ddz, us_input, 'us_tag');
setupInputFiles(rb_input_ddz, rb_input, 'rb_tag');

function setupInputFiles(element, input, type) {
    // 画像ドラッグ時の処理
    function handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'copy';
        element.classList.add('dragover'); // ドラッグ時のクラスを追加
    }
    // 画像ドラッグが終了した時の処理（ドラッグが終了したらクラスを削除）
    function handleDragLeave(e) {
        e.preventDefault();
        e.stopPropagation();
        element.classList.remove('dragover'); // ドラッグ終了時にクラスを削除
    }
    // 画像ドロップ時の処理
    function handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        element.classList.remove('dragover'); // ドロップ時にクラスを削除
        processFiles(e.dataTransfer.files, type);
    }
    // 画像クリック選択時の処理
    function handleFileSelect(e) {
        processFiles(e.target.files, type);
    }
    // ファイル処理ロジック
    function processFiles(files, type) {
        if (files.length === 1) {
            const fileType = files[0].type;
            if (fileType === 'image/avif') {
                alert('サポートされていないファイル形式です。別の画像ファイルを選択してください。');
            } else if (fileType.match('image.*')) {
                processImageFiles(files[0], type);
            } else {
                alert('サポートされていないファイル形式です。別の画像ファイルを選択してください。');
            }
            // ドラッグ＆ドロップで受け取ったファイルをinput要素に設定
            input.files = createFileList(files[0]);
        } else {
            alert('アップロードできる画像は1つです。');
        }
    }
    element.addEventListener('dragover', handleDragOver, false);
    element.addEventListener('dragleave', handleDragLeave, false);
    element.addEventListener('drop', handleDrop, false);
    element.addEventListener('click', () => input.click());
    input.addEventListener('change', handleFileSelect);
}

function processImageFiles(file, type) {
    const reader = new FileReader();
    reader.onload = (e) => {
        const imageSrc = e.target.result;
        if (type === 'us_tag') {
            ddzDisplayUpdate(us_input_ddz, imageSrc, function() {
                btnDisplayUpdate(true, us_process_btn, us_reset_btn);
            });
        } else if (type === 'rb_tag') {
            ddzDisplayUpdate(rb_input_ddz, imageSrc, function() {
                btnDisplayUpdate(true, rb_process_btn, rb_reset_btn);
            });
        }
    };
    reader.readAsDataURL(file);
}

// DataTransferオブジェクトを使用してFileListオブジェクトを作成するヘルパー関数
function createFileList(file) {
    // FileListオブジェクトは読み取り専用なので、間接的に作成する必要がある
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    return dataTransfer.files;
}

// ===========================================================================

setupProcessButton(us_process_btn, us_input, 'upscale-image/', 'image', us_download_btn,
us_reset_btn, us_processing_btn, us_downloading_btn, us_input_ddz, function() {
    setupReset_us();
});

setupProcessButton(rb_process_btn, rb_input, 'remove-background/', 'image', rb_download_btn, 
rb_reset_btn, rb_processing_btn, rb_downloading_btn, rb_input_ddz, function() {
    setupReset_rb();
});

function setupProcessButton(btn, input, url, appendName, downloadButton, resetButton, processingButton, downloadingButton, displayUpdateElement, setupReset) {
    btn.addEventListener('click', () => {
        isProcessing = true;
        
        const file = input ? input.files[0] : null;
        if (!file) {
            alert('画像のアップロードが必要です。');
            return;
        }

        btnDisplayUpdate(false, btn, resetButton);
        btnDisplayUpdate(true, processingButton);

        var formData = new FormData();
        if (file) formData.append(appendName, file);

        const csrftoken = getCookie('csrftoken');
        fetch(url, {
            method: 'POST',
            body: formData,
            headers: {
                'X-CSRFToken': csrftoken
            }
        })
        .then(handleErrors)
        .then(response => response.json())
        .then(data => {
            if (data && data.image) {
                const base64Data = data.image.startsWith('data:image/png;base64,') ? data.image : 'data:image/png;base64,' + data.image;
                ddzDisplayUpdate(displayUpdateElement, base64Data, function() {
                    btnDisplayUpdate(false, processingButton);
                    btnDisplayUpdate(true, downloadButton, resetButton);
                });
                downloadButton.onclick = () => startDownload(base64Data, setupReset, function() {
                    btnDisplayUpdate(false, downloadButton, resetButton);
                    btnDisplayUpdate(true, downloadingButton);
                });
            } else {
                alert('エラーが発生しました。' + (data && data.error ? data.error : "不明なエラーが発生しました。"));
                setupReset();
            }
        })
        .catch(error => {
            console.error('エラーが発生しました。:', error);
            alert('エラーが発生しました。');
            setupReset();
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

function startDownload(base64Data, callback, btnAddOn) {
    if (base64Data) {
        btnAddOn();

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
                callback();
            }, 1000);
        });

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

// ===========================================================================

us_reset_btn.addEventListener('click', setupReset_us);
rb_reset_btn.addEventListener('click', setupReset_rb);

function setupReset_us() {
    isProcessing = false;
    const us_prev_images = document.querySelectorAll('#upscale .preview');
    us_prev_images.forEach(image => image.remove());
    us_input.value = '';
    us_input_ddz.style.display = 'flex';
    btnDisplayUpdate(false, us_reset_btn, us_process_btn, us_processing_btn, us_download_btn, us_downloading_btn);
}

function setupReset_rb() {
    isProcessing = false;
    const rb_prev_images = document.querySelectorAll('#removebg .preview');
    rb_prev_images.forEach(image => image.remove());
    rb_input.value = '';
    rb_input_ddz.style.display = 'flex';
    btnDisplayUpdate(false, rb_reset_btn, rb_process_btn, rb_processing_btn, rb_download_btn, rb_downloading_btn);
}

// ===========================================================================