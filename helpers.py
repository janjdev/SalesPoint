import ast, csv
from datetime import datetime
from os import name
from app import app, db, Staff,os
from numpy import genfromtxt
from flask import Flask, session, request, json
from flask_sqlalchemy import SQLAlchemy
from hashutil import make_pw_hash, check_pw_hash

#Get list of rows from table form
def multiRow(list):
    q = ast.literal_eval(list)            
    r = []
    for i in q:
        v = {}
        for e in i:
            k = e.split('=')
            v.update({k[0]: k[1]})
        r.append(v)
    return r

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

def getDate():
    return datetime.now().strftime("%A, %B, %d")

def setBusInfo(name, phone, add, city, st, zip):
    with open('configs/info.json', 'r+') as info:
        data = json.load(info)
        if name != '':
            data['name'] = name
        if phone != '':
            data['phone'] = phone
        if add != '':
            data['address'] = add
        if city != '':
            data['city'] = city
        if st != '':
            data['state'] = st
        if zip != '':
            data['zip'] = zip
        info.seek(0)
        json.dump(data, info)
        info.truncate()
        info.close()

def getBusInfo():
    try:
        with open('configs/info.json') as info:
            data = json.load(info)
            info.close()
            return data
    except:        
        return False

def setTerminal(id, location, checked, timer, font, font_path):
    with open('configs/terminal.json', 'r+') as info:
        data = json.load(info)
        if id != '':
            data['id'] = id
        if location != '':
            data['location'] = location
        if checked != '':
            data['set_timer'] = checked
        if timer != '':
            data['timer'] = timer
        if font != '':
            data['default_font'] = font
        if font_path != '':
            data['font_path'] = font_path
        info.seek(0)
        json.dump(data, info)
        info.truncate()
        info.close()

def getTerminal():
    try:
        with open('configs/terminal.json') as info:
            data = json.load(info)
            info.close()
            return data
    except:        
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
        jsonFile.close()       
    return False

def getImages():
    list_images = os.listdir(app.config['ABSOLUTE_PATH'])
    images = []
    i = 0
    length = len(list_images)
    while i < length:
        img = {}
        img_part = list_images[i].split('.')
        img['name'] = img_part[0]
        ext = img_part[1]
        img['url'] = os.path.join(app.config['RELATIVE_PATH'], img['name']+'.'+ext)
        images.append(img)
        i+=1 
    return images

def setAutolog(time):
     with open('configs/app.json', 'r+') as jFile:
        data = json.load(jFile)
        data['atuolog'] = True
        data['timer'] = time
        jFile.seek(0)  # rewind
        json.dump(data, jFile)
        #jsonFile.truncate()     


def getAutolog():
    with open ('configs/app.json', 'r+') as jfile:
        data = json.load(jfile)
        autolog = data['autolog']
    return autolog

def Load_Data(file_name):
    # data = genfromtxt(file_name,  delimiter=',', skip_header=1, converters={0: lambda s: str(s)})
    with open(file_name) as f:
        reader = csv.reader(f)
        next(f)
        # data = [tuple(row) for row in reader]
        data = list(reader)
    return data #.tolist()