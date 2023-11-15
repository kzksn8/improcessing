from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from rembg import remove
import io
from PIL import Image

@csrf_exempt
def remove_background(request):
    if request.method == 'POST':
        # リクエストから画像データを取得
        file = request.FILES['image']
        input_image = Image.open(file)

        # 背景削除処理
        output_image = remove(input_image)

        # 処理後の画像をバイト配列に変換
        img_byte_arr = io.BytesIO()
        output_image.save(img_byte_arr, format='PNG')
        img_byte_arr = img_byte_arr.getvalue()

        # レスポンスとして返却
        return JsonResponse({'image': img_byte_arr})
    else:
        return JsonResponse({'error': 'Invalid request'}, status=400)