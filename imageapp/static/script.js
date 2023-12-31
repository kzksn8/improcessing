// ===========================================================================
// 
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
// ===========================================================================

const st_input_ddz_content = document.getElementById('st_input_ddz_content');
const st_input_ddz_style   = document.getElementById('st_input_ddz_style');
const st_reset_btn         = document.getElementById('st_reset_btn');
const st_process_btn       = document.getElementById('st_process_btn');
const st_processing_btn    = document.getElementById('st_processing_btn');
const st_download_btn      = document.getElementById('st_download_btn');
const st_downloading_btn   = document.getElementById('st_downloading_btn');
const st_output_prev       = document.getElementById('st_output_prev');

const rb_input_ddz         = document.getElementById('rb_input_ddz');
const rb_reset_btn         = document.getElementById('rb_reset_btn');
const rb_process_btn       = document.getElementById('rb_process_btn');
const rb_processing_btn    = document.getElementById('rb_processing_btn');
const rb_download_btn      = document.getElementById('rb_download_btn');
const rb_downloading_btn   = document.getElementById('rb_downloading_btn');

// ===========================================================================
// buttonDisplay
// ===========================================================================

function btnDisplay(show, ...elements) {
    elements.forEach(element => {
        element.style.display = show ? 'block' : 'none';
    });
}

// ===========================================================================
// 
// ===========================================================================

const st_input_content = setupInput('file', 'image/*', 'none');
const st_input_style   = setupInput('file', 'image/*', 'none');
const rb_input         = setupInput('file', 'image/*', 'none');

function setupInput(type, accept, display) {
    const input = document.createElement('input');
    input.type = type;
    input.accept = accept;
    input.style.display = display;
    return input;
}

// ===========================================================================
// 
// ===========================================================================

setupInputDragDrop(st_input_ddz_content, st_input_content, 'tag_styletf_content');
setupInputDragDrop(st_input_ddz_style, st_input_style, 'tag_styletf_style');
setupInputDragDrop(rb_input_ddz, rb_input, 'tag_removebg');

function setupInputDragDrop(element, input, type) {
    if (element) {
        element.addEventListener('dragover', handleDragOver, false);
        element.addEventListener('drop', (e) => handleDrop(e, type));
    } else {
        console.error('setupDragDropの要素が見つかりません。:', type);
    }
}

function handleDragOver(e) {
    e.preventDefault();  // デフォルトの処理をキャンセル
    e.dataTransfer.dropEffect = 'copy';  // ドロップ時のカーソルスタイルをコピーに設定
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
// 
// ===========================================================================

// setupInputFileSelect(st_input_content, 'tag_styletf_content');
// setupInputFileSelect(st_input_style, 'tag_styletf_style');
// setupInputFileSelect(rb_input, 'tag_removebg');

setupInputFileSelect(st_input_ddz_content, st_input_content, 'tag_styletf_content');
setupInputFileSelect(st_input_ddz_style, st_input_style, 'tag_styletf_style');
setupInputFileSelect(rb_input_ddz, rb_input, 'tag_removebg');

function setupInputFileSelect(element, input, type) {
    if (element) {
        element.addEventListener('click', () => input.click());
    } else {
        console.error('setupInputFileSelectの要素が見つかりません。:', type);
    }
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
// 
// ===========================================================================

function processImage(file, type) {
    const reader = new FileReader();
    reader.onload = (e) => {
        const imageSrc = e.target.result;
        if (type === 'tag_styletf_content') {
            updateDDZDisplay(st_input_ddz_content, imageSrc, function() {
                updateCompositeButtonVisibility();
            });
        } else if (type === 'tag_styletf_style') {
            updateDDZDisplay(st_input_ddz_style, imageSrc, function() {
                updateCompositeButtonVisibility();
            });
        } else if (type === 'tag_removebg') {
            updateDDZDisplay(rb_input_ddz, imageSrc, function() {
                btnDisplay(true, rb_process_btn, rb_reset_btn);
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
    const foregroundImage = st_input_content.files[0];
    const backgroundImage = st_input_style.files[0];
    if (foregroundImage && backgroundImage) {
        btnDisplay(true, st_process_btn);
    } else {
        btnDisplay(false, st_process_btn);
    }
    st_reset_btn.style.display = (foregroundImage || backgroundImage) ? 'block' : 'none';
}

// ===========================================================================
// 
// ===========================================================================

st_process_btn.addEventListener('click', () => {
    const foregroundFile = st_input_content.files[0];
    const backgroundFile = st_input_style.files[0];

    // エラーチェック: ファイルが選択されているかどうか
    if (!foregroundFile || !backgroundFile) {
        alert('前景画像と背景画像の両方が必要です。');
        return;
    }

    btnDisplay(false, st_process_btn, st_reset_btn);
    btnDisplay(true, st_processing_btn);

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
            const base64Data1 = data.image;
            updateDDZDisplay(st_output_prev, 'data:image/png;base64,' + base64Data1, function() {
                btnDisplay(false, st_processing_btn);
                btnDisplay(true, st_download_btn, st_reset_btn);
            });
            st_download_btn.onclick = () => startDownload(base64Data1, [st_download_btn, st_reset_btn], [st_downloading_btn], st_reset_func);
        } else {
            alert('画像の合成に失敗しました。' + (data && data.error ? data.error : "不明なエラーが発生しました。"));
            st_reset_func();
        }
    })
    .catch(error => {
        console.error('画像合成中にエラーが発生しました:', error);
        alert('エラーが発生しました。コンソールを確認してください。');
        st_reset_func();
    });
});

// ===========================================================================
// 
// ===========================================================================

rb_process_btn.addEventListener('click', () => {
    const file = rb_input.files[0];

    // エラーチェック: ファイルが選択されているかどうか
    if (!file) {
        alert('画像のアップロードが必要です。');
        return;
    }

    btnDisplay(false, rb_reset_btn, rb_process_btn);
    btnDisplay(true, rb_processing_btn);

    // ファイルをFormDataオブジェクトに追加
    var formData = new FormData();
    formData.append('image', file);

    // サーバーにPOSTリクエストを送信
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
        // レスポンスの検証: サーバーからのレスポンスに 'image' プロパティが含まれているか
        if (data && data.image) {
            const base64Data2 = data.image;
            updateDDZDisplay(rb_input_ddz, 'data:image/png;base64,' + base64Data2, function() {
            btnDisplay(false, rb_processing_btn);
            btnDisplay(true, rb_download_btn, rb_reset_btn);
        });
        rb_download_btn.onclick = () => startDownload(base64Data2, [rb_download_btn, rb_reset_btn], [rb_downloading_btn], rb_reset_func);
        } else {
            alert('画像の背景削除に失敗しました。' + (data && data.error ? data.error : "不明なエラーが発生しました。"));
            st_reset_func();
        }
    })
    .catch(error => {
        console.error('背景削除中にエラーが発生しました:', error);
        alert('エラーが発生しました。コンソールを確認してください。');
        rb_reset_func();
    });
});

// ===========================================================================
// 
// ===========================================================================

// CSRFトークンをクッキーから取得し、クッキーから特定の名前の値を取得
const csrftoken = getCookie('csrftoken');

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

function startDownload(base64Data, elementsToHide, elementsToShow, callback) {
    if (base64Data) {
        btnDisplay(false, ...elementsToHide);
        btnDisplay(true, ...elementsToShow);

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
// 
// ===========================================================================

st_reset_btn.addEventListener('click', setupReset_st);
rb_reset_btn.addEventListener('click', setupReset_rb);

function setupReset_st() {
    const st_prev_images = document.querySelectorAll('#styletf .preview');
    st_prev_images.forEach(image => image.remove());
    st_input_content.value = '';
    st_input_style.value = '';
    st_input_ddz_content.style.display = 'flex';
    st_input_ddz_style.style.display = 'flex';
    st_output_prev.style.display = 'none';
    btnDisplay(false, st_reset_btn, st_process_btn, st_processing_btn, st_download_btn, st_downloading_btn);
}

function setupReset_rb() {
    const rb_prev_images = document.querySelectorAll('#removebg .preview');
    rb_prev_images.forEach(image => image.remove());
    rb_input.value = '';
    rb_input_ddz.style.display = 'flex';
    btnDisplay(false, rb_reset_btn, rb_process_btn, rb_processing_btn, rb_download_btn, rb_downloading_btn);
}

// ===========================================================================