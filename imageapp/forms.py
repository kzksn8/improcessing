from django import forms
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth.models import User


# ログインフォーム
class LoginForm(forms.Form):
    email = forms.EmailField(label='メールアドレス')
    password = forms.CharField(label='パスワード', widget=forms.PasswordInput)


# サインアップフォーム
class SignUpForm(UserCreationForm):
    email = forms.EmailField(max_length=254, help_text='有効なメールアドレスを入力してください。')

    class Meta:
        model = User
        fields = ('email', 'password1', 'password2', )