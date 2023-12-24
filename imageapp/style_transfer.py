import torch
import torch.optim as optim
from io import BytesIO
from PIL import Image
from torchvision import transforms
from torchvision.models import vgg19

# デバイスを設定（GPUが利用可能な場合はGPUを使用）
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# 画像の読み込みと前処理を行う関数
def load_image(image_bytes, max_size=512, shape=None):
    # BytesIOを介して画像データを読み込みます
    image = Image.open(BytesIO(image_bytes)).convert('RGB')
    
    # 画像サイズを大きすぎないように調整
    if max(image.size) > max_size:
        size = max_size
    else:
        size = max(image.size)
    
    if shape is not None:
        size = shape[0]  # または、shape[1] など、適切な次元を選択

    # PIL画像のサイズを取得
    original_size = image.size  # PILのImage.sizeはタプルを返す

    # 画像のリサイズサイズを計算（アスペクト比を保持）
    new_height = int(size * original_size[1] / original_size[0])
    in_transform = transforms.Compose([
        transforms.Resize((size, new_height)),
        transforms.ToTensor(),
        transforms.Normalize((0.485, 0.456, 0.406), (0.229, 0.224, 0.225))
    ])

    # バッチ次元を追加してデバイスに画像を転送
    image = in_transform(image)[:3,:,:].unsqueeze(0).to(device)

    return image

# VGGモデルをロードし、特徴抽出器を取得
def get_feature_extractor():
    model = vgg19(pretrained=True).features
    for param in model.parameters():
        param.requires_grad_(False)
    return model

# 特徴マップを抽出する関数
def get_features(image, model, layers=None):
    if layers is None:
        layers = {'0': 'conv1_1', '5': 'conv2_1', '10': 'conv3_1', '19': 'conv4_1', '21': 'conv4_2', '28': 'conv5_1'}
    features = {}
    x = image
    for name, layer in model._modules.items():
        x = layer(x)
        if name in layers:
            features[layers[name]] = x
    return features

# スタイル損失を計算する関数
def calculate_style_loss(target_features, style_features):
    style_loss = 0
    for layer in style_features.keys():
        target_feature = target_features[layer]
        target_gram = gram_matrix(target_feature)
        style_gram = gram_matrix(style_features[layer])

        # テンソルのサイズ（次元のサイズ）を取得
        d, h, w = target_feature.shape[1], target_feature.shape[2], target_feature.shape[3]

        # スタイル損失の計算で、個々のサイズを使用
        layer_loss = torch.mean((target_gram - style_gram) ** 2)
        style_loss += layer_loss / (d * h * w)
    return style_loss

# コンテンツ損失を計算する関数
def calculate_content_loss(target_features, content_features):
    content_loss = torch.mean((target_features['conv4_2'] - content_features['conv4_2']) ** 2)
    return content_loss

# グラム行列を計算する関数
def gram_matrix(tensor):
    _, d, h, w = tensor.size()
    tensor = tensor.view(d, h * w)
    gram = torch.mm(tensor, tensor.t())
    return gram

# スタイル転送のメイン関数
# Step数の調整で計算時間変化
def style_transfer(content_img, style_img, model, content_weight=1e5, style_weight=1e10, steps=100):
    # 特徴抽出器を評価モードに設定
    model.eval()

    # 特徴を抽出
    content_features = get_features(content_img, model)
    style_features = get_features(style_img, model)
    target = content_img.clone().requires_grad_(True)
    optimizer = optim.Adam([target], lr=0.003)

    for i in range(1, steps+1):
        target_features = get_features(target, model)

        content_loss = calculate_content_loss(target_features, content_features)
        style_loss = calculate_style_loss(target_features, style_features)

        total_loss = content_weight * content_loss + style_weight * style_loss

        optimizer.zero_grad()
        total_loss.backward()
        optimizer.step()

        # Stepの進捗の出力
        if i % 20 == 0:
            print("Step {}/{}".format(i, steps))
            print("Total loss: ", total_loss.item())

    return target