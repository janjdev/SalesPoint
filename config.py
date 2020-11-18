import os
path = os.sep + 'static' + os.sep + 'assets' + os.sep + 'img' + os.sep +'food'
importPath = os.sep + 'files' + os.sep + 'tmpfiles'



SECRET_KEY = '\x1c\x845\xf95\x93I\xfe\xff\x00>60\xb5\xc0\x0f'
CACHE_TYPE = "null"
DEBUG = True
SQLALCHEMY_DATABASE_URI = "sqlite:///"+os.getcwd()+"/salespoint.db"
SQLALCHEMY_ECHO = True
ABSOLUTE_PATH = os.getcwd() + path
IMPORTS = os.getcwd()+ importPath
RELATIVE_PATH = '/static/assets/img/food/'
ALLOWED_IMAGE_EXTENSIONS = ['PNG', 'JPG', 'JPEG']







