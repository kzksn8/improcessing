import os
import io
from base64 import b64encode

import torch
import numpy as np
from PIL import Image
from basicsr.archs.rrdbnet_arch import RRDBNet

from django.shortcuts import render
from django.conf import settings
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt


# urls.pyファイル内でindex.htmlをマッピング
def index(request):
    return render(request, 'index.html')


# cudaがあればGPUを使用する
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")


# モデルの初期化
model = RRDBNet(num_in_ch=3, num_out_ch=3, num_feat=64, num_block=23, num_grow_ch=32, scale=4)
model_path = os.path.join(settings.BASE_DIR, 'pretrained', 'RealESRGAN_x4plus.pth')
checkpoint = torch.load(model_path, map_location=device)
model.load_state_dict(checkpoint['params_ema'])
model.to(device)
model.eval()


# 超解像モデルのロジック
@csrf_exempt
def upscale_image(request):
    if request.method == 'POST':
        file = request.FILES.get('image')
        if not file:
            return JsonResponse({'error': 'ファイルが提供されていません。'}, status=400)

        # 画像ファイルを読み込み、RGBに変換する
        image_file = request.FILES['image']
        image = Image.open(image_file).convert('RGB')

        # 画像のサイズを取得
        width, height = image.size
        
        # 処理画像の最大サイズを定義
        limit_size = 750

        # 画像サイズの前処理
        # 縦がlimit_sizeピクセルより大きい場合の処理
        if height > limit_size and height >= width:
            new_height = limit_size
            new_width = int(new_height * width / height)
            new_width -= new_width % 2  # 横のピクセル数が奇数の場合、マイナス1
            image = image.resize((new_width, new_height), Image.Resampling.LANCZOS)

        # 横がlimit_sizeピクセルより大きい場合の処理
        elif width > limit_size and width >= height:
            new_width = limit_size
            new_height = int(new_width * height / width)
            new_height -= new_height % 2  # 縦のピクセル数が奇数の場合、マイナス1
            image = image.resize((new_width, new_height), Image.Resampling.LANCZOS)

        # 縦横ともにlimit_sizeピクセル以下で、いずれかが奇数の場合の処理
        elif width <= limit_size and height <= limit_size:
            new_width = width - (width % 2)  # 横のピクセル数が奇数の場合、マイナス1
            new_height = height - (height % 2)  # 縦のピクセル数が奇数の場合、マイナス1
            image = image.resize((new_width, new_height), Image.Resampling.LANCZOS)

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