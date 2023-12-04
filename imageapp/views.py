import io
import os
from PIL import Image
from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from rembg import remove
from base64 import b64encode

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