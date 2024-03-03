import os
import io

import torch
import numpy as np
from PIL import Image
from basicsr.archs.rrdbnet_arch import RRDBNet

from django.shortcuts import render
from django.conf import settings
from django.http import JsonResponse
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt


# urls.pyファイル内でindex.htmlをマッピング
def index(request):
    return render(request, 'index.html')


# cudaがあればGPUを使用する
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")


# 超解像処理前の画像サイズ調整ロジック
def image_adjustment(size, limit):
    width, height = size
    if max(width, height) > limit:
        if height >= width:
            new_height = limit
            new_width = int(limit * width / height) - (int(limit * width / height) % 2)
        else:
            new_width = limit
            new_height = int(limit * height / width) - (int(limit * height / width) % 2)
    else:
        new_width = width - (width % 2)
        new_height = height - (height % 2)
    
    return new_width, new_height


# 超解像モデルのロジック
@csrf_exempt
def upscale_image(request, scale):
    if request.method != 'POST':
        return JsonResponse({'error': 'POSTリクエストのみ受け付けます。'}, status=400)

    file = request.FILES.get('image')
    if not file:
        return JsonResponse({'error': 'ファイルが提供されていません。'}, status=400)

    model_path = os.path.join(settings.BASE_DIR, 'pretrained', f'RealESRGAN_x{scale}plus.pth')
    if not os.path.exists(model_path):
        return JsonResponse({'error': 'モデルファイルが見つかりません。'}, status=500)

    model = RRDBNet(num_in_ch=3, num_out_ch=3, num_feat=64, num_block=23, num_grow_ch=32, scale=scale)
    checkpoint = torch.load(model_path, map_location='cpu')
    model.load_state_dict(checkpoint['params_ema'])
    model.eval()

    image = Image.open(file).convert('RGB')
    if scale == 4:
        limit_size = 750
    else:
        limit_size = 1500
    new_width, new_height = image_adjustment(image.size, limit_size)
    image = image.resize((new_width, new_height), Image.Resampling.LANCZOS)

    lr_img = np.array(image).astype(np.float32) / 255.0
    lr_img = torch.from_numpy(lr_img).permute(2, 0, 1).unsqueeze(0)

    with torch.no_grad():
        sr_img = model(lr_img).squeeze(0).mul(255.0).clamp(0, 255).byte().cpu().numpy()
    sr_img = np.transpose(sr_img, (1, 2, 0))
    output_image = Image.fromarray(sr_img)

    buffer = io.BytesIO()
    output_image.save(buffer, format="PNG")
    buffer.seek(0)
    
    return HttpResponse(buffer, content_type="image/png")