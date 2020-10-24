from app import app, db, Staff,os
from flask import Flask, session, request, json
from flask_sqlalchemy import SQLAlchemy
from hashutil import make_pw_hash, check_pw_hash

#Create function to get default values from other columns when needed
def same_as(column_name):
    def default_function(context):
        return context.get_current_parameters()[column_name]
    return default_function

#Validation function called before every operation
def login(secret_key):
    secrets = db.session.query(Staff.staff_id).all()
    for key in secrets:
        if check_pw_hash(secret_key, key):
            return True
    return False

def getFonts():
    with open('lists/fonts.json') as f:
        data = json.load(f)
        fonts = []
        for font in data:
            index = font.rindex('\\')
            extIndex = font.rindex('.')
            font_name = font[index+1: extIndex]
            fonts.append((font_name, font))
    return fonts
    
def getURL():
    with open('configs/app.json', 'r+') as jsonFile:
        data = json.load(jsonFile)
        data['base'] = request.url_root
        jsonFile.seek(0)  # rewind
        json.dump(data, jsonFile)
        jsonFile.truncate()       
    return False

def getImages():
    list_images = os.listdir(app.config['SITE_UPLOADS'])
    images = []
    i = 0
    length = len(list_images)
    while i < length:
        img = {}
        img_part = list_images[i].split('.')
        img['name'] = img_part[0]
        ext = img_part[1]
        img['url'] = os.path.join(app.config['RELATIVE_PATH_ADMIN'], img['name']+'.'+ext)
        images.append(img)
        i+=1 
    return images

    
    