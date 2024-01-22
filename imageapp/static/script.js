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
    changeTab('home');  // デフォルトでホームタブを表示
});

// タブを切り替える関数
function changeTab(targetId) {
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

// HTML要素の参照
const us_html_ids = ['us_input_ddz', 'us_reset_btn', 'us_process_btn',
                     'us_processing_btn', 'us_download_btn', 'us_downloading_btn'];

const [us_input_ddz, us_reset_btn, us_process_btn,
       us_processing_btn, us_download_btn, us_downloading_btn]
       = us_html_ids.map(id => document.getElementById(id));

const rb_html_ids = ['rb_input_ddz', 'rb_reset_btn', 'rb_process_btn',
                     'rb_processing_btn', 'rb_download_btn', 'rb_downloading_btn'];

const [rb_input_ddz, rb_reset_btn, rb_process_btn,
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
        e.dataTransfer.dropEffect = 'copy';
    }
    // 画像ドロップ時の処理
    function handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
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
        } else {
            alert('アップロードできる画像は1つです。');
        }
    }
    element.addEventListener('dragover', handleDragOver, false);
    element.addEventListener('drop', handleDrop);
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

// ===========================================================================

setupProcessButton(us_process_btn, us_input, null, 'upscale-image/', 'image', null,
us_download_btn, us_reset_btn, us_processing_btn, us_downloading_btn, us_input_ddz, function() {
    setupReset_us();
});

setupProcessButton(rb_process_btn, rb_input, null, 'remove-background/', 'image', null,
rb_download_btn, rb_reset_btn, rb_processing_btn, rb_downloading_btn, rb_input_ddz, function() {
    setupReset_rb();
});

function setupProcessButton(btn, input1, input2, url, appendName1, appendName2, downloadButton, resetButton, processingButton, downloadingButton, displayUpdateElement, setupReset) {
    btn.addEventListener('click', () => {
        const file1 = input1 ? input1.files[0] : null;
        const file2 = input2 ? input2.files[0] : null;

        if (!file1 || (input2 && !file2)) {
            alert('画像のアップロードが必要です。');
            return;
        }

        btnDisplayUpdate(false, btn, resetButton);
        btnDisplayUpdate(true, processingButton);

        var formData = new FormData();
        if (file1) formData.append(appendName1, file1);
        if (file2) formData.append(appendName2, file2);

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
        // エラーレスポンスの内容をログに出力するためにJSONを解析
        clonedResponse.json().then(json => {
            console.error('Error response JSON:', json);
            alert('エラーが発生しました。: ' + (json.error || '不明なエラー'));
        }).catch(() => {
            // JSONの解析に失敗した場合は、テキストとして出力
            clonedResponse.text().then(text => {
                console.error('Error response text:', text);
                alert('エラーが発生しました。: ' + text);
            });
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
    const us_prev_images = document.querySelectorAll('#upscale .preview');
    us_prev_images.forEach(image => image.remove());
    us_input.value = '';
    us_input_ddz.style.display = 'flex';
    btnDisplayUpdate(false, us_reset_btn, us_process_btn, us_processing_btn, us_download_btn, us_downloading_btn);
}

function setupReset_rb() {
    const rb_prev_images = document.querySelectorAll('#removebg .preview');
    rb_prev_images.forEach(image => image.remove());
    rb_input.value = '';
    rb_input_ddz.style.display = 'flex';
    btnDisplayUpdate(false, rb_reset_btn, rb_process_btn, rb_processing_btn, rb_download_btn, rb_downloading_btn);
}

// ===========================================================================

// // スライダーの初期化関数
// function initializeSlider() {
//     const slider = document.getElementById('beforeAfterSlider');
//     const beforeImage = document.querySelector('.before-image');
//     const afterImage = document.querySelector('.after-image');
  
//     // スライダーの値が変更されたときのイベントリスナー
//     slider.oninput = function() {
//       const sliderValue = this.value;
//       // before-imageの表示範囲をスライダーの値に応じて変更
//       beforeImage.style.clipPath = `inset(0 ${100 - sliderValue}% 0 0)`;
//       // after-imageの表示範囲をスライダーの値に応じて変更
//       afterImage.style.clipPath = `inset(0 0 0 ${sliderValue}%)`;
//     };
//   }
  
//   // ページの読み込みが完了したらスライダーを初期化
//   window.onload = initializeSlider;

  // ===========================================================================