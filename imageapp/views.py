import os
import io
from io import BytesIO

import torch
from torchvision import transforms
from PIL import Image
from rembg import remove

from base64 import b64encode
from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .style_transfer import style_transfer, get_feature_extractor

# デバイスを設定（GPUが利用可能な場合はGPUを使用）
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

def index(request):
    return render(request, 'index.html')

# メモリから画像を読み込むための新しい関数
def load_image_from_memory(image, max_size=512, shape=None):
    # 元のアスペクト比を保持するために新しいサイズを計算
    aspect_ratio = image.width / image.height
    if aspect_ratio > 1:  # 幅が高さより大きい場合
        new_width  = min(image.width, max_size)
        new_height = int(new_width / aspect_ratio)
    else:  # 高さが幅より大きい、または等しい場合
        new_height = min(image.height, max_size)
        new_width  = int(new_height * aspect_ratio)

    # 画像の前処理を行うための変換
    in_transform = transforms.Compose([
        transforms.Resize((new_height, new_width)),
        transforms.ToTensor(),
        transforms.Normalize((0.485, 0.456, 0.406), (0.229, 0.224, 0.225))
    ])

    # バッチ次元を追加してテンソルに変換
    image_tensor = in_transform(image).unsqueeze(0).to(device)

    return image_tensor

@csrf_exempt
def style_transfer_view(request):
    if request.method == 'POST':
        content_file = request.FILES.get('content_img')
        style_file   = request.FILES.get('style_img')

        if not content_file or not style_file:
            return JsonResponse({'error': 'コンテンツ画像とスタイル画像の両方が必要です。'}, status=400)

        try:
            content_image = Image.open(BytesIO(content_file.read())).convert('RGB')
            style_image   = Image.open(BytesIO(style_file.read())).convert('RGB')

            content_tensor = load_image_from_memory(content_image)
            style_tensor   = load_image_from_memory(style_image, shape=content_tensor.shape[-2:])

            vgg = get_feature_extractor().to(device)

            output_tensor = style_transfer(content_tensor, style_tensor, vgg)
            output_image  = transforms.ToPILImage()(output_tensor.squeeze(0))

            img_byte_arr = BytesIO()
            output_image.save(img_byte_arr, format='PNG')
            encoded_img = b64encode(img_byte_arr.getvalue()).decode('ascii')

            return JsonResponse({'image': encoded_img})
        
        except Exception as e:
            return JsonResponse({'error': '画像処理中にエラーが発生しました: ' + str(e)}, status=500)

    else:
        return JsonResponse({'error': '無効なリクエスト方法です。'}, status=400)

@csrf_exempt
def remove_background(request):
    if request.method == 'POST':
        # リクエストから画像データを取得
        file = request.FILES.get('image')
        if not file:
            return JsonResponse({'error': 'ファイルが提供されていません。'}, status=400)
        
        # 入力された画像の拡張子を取得
        file_extension = os.path.splitext(file.name)[1].lower()

        # PNG以外の拡張子であれば、透過可能なフォーマットに変換する
        if file_extension not in ['.png', '.apng']:
            file_extension = '.png'

        input_image = Image.open(file)

        # 背景削除処理
        output_image = remove(input_image)

        # 処理後の画像をバイト配列に変換し、Base64エンコードする
        img_byte_arr = io.BytesIO()
        output_image.save(img_byte_arr, format=file_extension[1:].upper())  # 拡張子をフォーマットに変換
        encoded_img = b64encode(img_byte_arr.getvalue()).decode('ascii')  # Base64にエンコード

        # Base64エンコードされた画像データをレスポンスとして返却
        return JsonResponse({'image': encoded_img})
    
    else:
        # POSTリクエストでない場合はエラーを返す
        return JsonResponse({'error': '無効なリクエストです。'}, status=400)