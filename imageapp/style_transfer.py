import torch
from PIL import Image
import torchvision.models as models
import torchvision.transforms as transforms

def process_image(image_bytes):
    # 画像読み込み
    image = Image.open(image_bytes)

    # 画像の前処理
    transform = transforms.Compose([
        transforms.Resize((224, 224)),  # リサイズ
        transforms.ToTensor(),          # テンソルに変換
        transforms.Normalize(           # 正規化
            mean=[0.485, 0.456, 0.406],
            std=[0.229, 0.224, 0.225]
        )
    ])

    # 画像の変換とバッチ次元の追加
    image_tensor = transform(image).unsqueeze(0)

    return image_tensor

def style_transfer(content_image, style_image):
    
    # モデルのロード
    vgg_model = models.vgg19(pretrained=True).features
    
    # モデルを評価モードに設定
    vgg19_model.eval()

    # 必要に応じてGPUにモデルを移動
    if torch.cuda.is_available():
        vgg19_model = vgg19_model.to('cuda')
    
    # 画像を処理可能な形式に変換
    content_img = process_image(content_image)
    style_img = process_image(style_image)
    
    # スタイル転送を実行
    output_img = vgg_model.transfer_style(content_img, style_img)
    
    # 処理後の画像を返却
    return output_img