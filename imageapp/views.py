import os
import io

import torch
import numpy as np
from PIL import Image
from rembg import remove

from django.shortcuts import render

from django.conf import settings
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from basicsr.archs.edsr_arch import EDSR
from base64 import b64encode

# デバイスを設定
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# モデルの初期化
model = EDSR(
    num_in_ch=3,
    num_out_ch=3,
    num_feat=64,
    num_block=16,
    upscale=2,
    res_scale=1,
    img_range=255.0
)

# プリトレーニング済みモデルの状態辞書を読み込む
model_path = os.path.join(settings.BASE_DIR, 'imageapp', 'pretrained_models', 'EDSR_Mx2_f64b16_DIV2K_official-3ba7b086.pth')
model.load_state_dict(torch.load(model_path, map_location=device), strict=False)
model.to(device)
model.eval()

@csrf_exempt
def upscale_image(request):
    if request.method == 'POST':
        file = request.FILES.get('image')
        if not file:
            return JsonResponse({'error': 'ファイルが提供されていません。'}, status=400)

        # 画像ファイルを読み込み、RGBに変換する
        image_file = request.FILES['image']
        image = Image.open(image_file).convert('RGB')

        # ピクセル値を[0, 1]に正規化
        lr_img = np.array(image).astype(np.float32) / 255.0
        # torchテンソルに変換し、バッチ次元を追加
        lr_img = torch.from_numpy(lr_img).permute(2, 0, 1).unsqueeze(0).to(device)

        # モデル推論
        with torch.no_grad():
            sr_img = model(lr_img).squeeze(0)

        # 出力テンソルを[0, 255]に非正規化
        sr_img = sr_img.mul(255.0).clamp(0.0, 255.0).cpu().numpy().astype(np.uint8)
        # PIL用にHeight x Width x Channels形式に変換
        sr_img = np.transpose(sr_img, (1, 2, 0))

        # スケールアップされた画像をPILイメージに変換する
        output_image = Image.fromarray(sr_img)

        # 結果をバイト配列に変換してbase64エンコードする
        buffer = io.BytesIO()
        output_image.save(buffer, format="PNG")
        image_base64 = b64encode(buffer.getvalue()).decode('utf-8')

        # base64エンコードされた画像をJSONレスポンスとして返す
        return JsonResponse({'image': 'data:image/png;base64,' + image_base64})
    else:
        # POSTリクエストでない場合はエラーを返す
        return JsonResponse({'error': 'POSTリクエストのみ受け付けます。'}, status=400)

def index(request):
    return render(request, 'index.html')

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