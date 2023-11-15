// CSRFトークンをクッキーから取得する関数
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

// CSRFトークンを取得
const csrftoken = getCookie('csrftoken');

document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('drop_zone').addEventListener('dragover', handleDragOver, false);
    document.getElementById('drop_zone').addEventListener('drop', handleDrop, false);
    document.getElementById('remove_bg_button').addEventListener('click', function() {
        removeBackground(document.getElementById('file_input').files[0]);
    }, false);
});

function handleDragOver(e) {
    e.stopPropagation();
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
}

function handleDrop(e) {
    e.stopPropagation();
    e.preventDefault();
    var files = e.dataTransfer.files;
    if (files.length > 0) {
        document.getElementById('file_input').files = files;
        removeBackground(files[0]);
    }
}

function removeBackground(file) {
    if (!file.type.match('image.*')) {
        alert('画像ファイルを選択してください。');
        return;
    }

    var formData = new FormData();
    formData.append('image', file);

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
        var outputImage = document.getElementById('output_image');
        outputImage.src = 'data:image/png;base64,' + data.image;
        outputImage.style.display = 'block';
        document.getElementById('download_button').style.display = 'block';
        document.getElementById('cancel_button').style.display = 'block';
    })
    .catch(error => {
        console.error('Error:', error);
        alert('エラーが発生しました。画像の背景を削除できませんでした。');
    });
}

document.getElementById('download_button').addEventListener('click', function() {
    var outputImage = document.getElementById('output_image').src;
    var link = document.createElement('a');
    link.href = outputImage;
    link.download = 'processed_image.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
});

document.getElementById('cancel_button').addEventListener('click', function() {
    var outputImage = document.getElementById('output_image');
    outputImage.style.display = 'none';
    outputImage.src = '';
    document.getElementById('download_button').style.display = 'none';
    document.getElementById('cancel_button').style.display = 'none';
    document.getElementById('file_input').value = '';
});

function handleErrors(response) {
    if (!response.ok) {
        throw Error(response.statusText);
    }
    return response;
}