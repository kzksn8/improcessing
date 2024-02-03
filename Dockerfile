# Pythonイメージをベースに使用
FROM python:3.10-slim

# 作業ディレクトリの設定
WORKDIR /app

# 必要なパッケージのインストール
COPY requirements.txt /app/
RUN pip install -r requirements.txt

# プロジェクトのファイルをコピー
COPY . /app/

# 静的ファイルの収集
RUN python manage.py collectstatic --noinput

# アプリケーションの起動コマンド
CMD ["gunicorn", "-b", "0.0.0.0:8000", "improcessing.wsgi:application"]