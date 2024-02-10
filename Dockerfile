# Pythonイメージをベースに使用
FROM python:3.10-slim

# 必要なパッケージと依存ライブラリのインストール
RUN apt-get update && \
    apt-get install -y gcc libc-dev libpcre3-dev python3-dev && \
    rm -rf /var/lib/apt/lists/*

# uwsgiのインストール
RUN pip install uwsgi

# 必要なパッケージのインストール
RUN apt-get update && \
    apt-get install -y libgl1-mesa-glx libglib2.0-0 libsm6 libxrender1 libxext6 && \
    rm -rf /var/lib/apt/lists/*

# OpenCVのheadlessモードとuwsgiのインストール
RUN pip install opencv-python-headless uwsgi

# 作業ディレクトリの設定
WORKDIR /app

# requirements.txtから依存Pythonライブラリをインストール
COPY requirements.txt .
RUN pip install -r requirements.txt && \
    rm -rf /root/.cache/pip

# プロジェクトのファイルをコピー
COPY . /app/

# アプリケーションの起動コマンド
CMD ["uwsgi", "--http", "0.0.0.0:8000", "--module", "improcessing.wsgi:application", "--master"]