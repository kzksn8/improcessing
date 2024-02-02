# FROM python:3.10-slim
FROM python:3.7

# pipをアップグレード
RUN pip install --upgrade pip

# libGLライブラリをインストール
RUN apt-get update && apt-get install -y libgl1-mesa-glx
RUN apt-get update && apt-get install -y libglib2.0-0

# 作業ディレクトリの設定
WORKDIR /workspace

# 環境変数を設定し、Pythonがpycファイルとディスクキャッシュを作成しないようにする
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# システムの依存関係をインストール
RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# vscodeユーザーを作成し、sudo権限を与える
RUN groupadd -r vscode && useradd -m -r -g vscode vscode \
    && apt-get update \
    && apt-get install -y sudo \
    && echo 'vscode ALL=(ALL) NOPASSWD: ALL' >> /etc/sudoers

# Pythonの依存関係をインストール
COPY requirements.txt /workspace/
RUN pip install --no-cache-dir -r requirements.txt

# ユーザー権限をvscodeに変更し、所有者を変更
RUN chown -R vscode:vscode /workspace
USER vscode

# プロジェクトのファイルをコピー
COPY . /workspace/

# ポート8000を公開
EXPOSE 8000

# コンテナ起動時にDjango開発サーバーを起動
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]