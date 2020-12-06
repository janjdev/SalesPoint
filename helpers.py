import ast, csv, os
from tempfile import mktemp
from win32 import win32print, win32api
from datetime import datetime,time, timedelta
from flask import request, json, make_response, render_template
import config
import locale
import ghostscript

import pdfkit
pdfconfig = pdfkit.configuration(wkhtmltopdf= 'venv\Lib\site-packages\wkhtmltopdf\\bin\wkhtmltopdf.exe')

#Get list of rows from table form
def multiRow(list):
    q = ast.literal_eval(list)            
    r = []
    for i in q:
        v = {}
        for e in i:
            k = e.split('=')
            if k[0] in v.keys():
                if type(v[k[0]]) == list:
                    v[k[0]].append(k[1])
                else:
                    x = v[k[0]]
                    v[k[0]] = []
                    v[k[0]].append(x)
                    v[k[0]].append(k[1])
            else:
                v.update({k[0]: k[1]})
        r.append(v)
    return r

#Create function to get default values from other columns when needed
def same_as(column_name):
    def default_function(context):
        return context.get_current_parameters()[column_name]
    return default_function

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
    list_images = os.listdir(config.ABSOLUTE_PATH)
    images = []
    i = 0
    length = len(list_images)
    while i < length:
        img = {}
        img_part = list_images[i].split('.')
        img['name'] = img_part[0]
        ext = img_part[1]
        img['url'] = os.path.join(config.RELATIVE_PATH, img['name']+'.'+ext)
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
    with open(file_name, 'r+', newline='') as f:
        reader = csv.reader(f, dialect='excel')
        next(f)
        data = list(reader)
        print(data)
    return data 

def calcualte(i, num=0, amount=0):
        num+=1
        subtotal=0
        ordtax=0
        od=0
        for item in i.items:
            qty = item.quantity
            price = item.item.unit_price
            subtotal = float(qty * price)
            # gross+=subtotal
            tax=0
            for t in item.item.taxes:
                tax+= float((t.tax_rate/100))
            # totaltax+= (tax*subtotal)
            ordtax += (tax*subtotal) 
        taxdis =0
        for dis in i.discounts:                
            if dis.discount.type_id == 1:
                od += float(dis.discount.value)
            else:
                taxdis += float(dis.discount.value)
        od+=(taxdis*subtotal)
        # totaldiscount+=od
        return ((subtotal-od)+ordtax)

def iterateData(data, opennum=0, paidnum=0, refundnum=0, voidnum=0, pendnum=0,open=0,paid=0,refund=0,void=0,pend=0,inamount=0,outamount=0,innum=0,outnum=0,gross=0,totaldiscount=0,totaltax=0):
    
    for i in data:
        if i.type_id == 1:   
            innum+=1
            subtotal=0
            ordtax=0
            od= 0
            for item in i.items:
                qty = item.quantity
                price = item.item.unit_price
                subtotal+= qty * price
                tax= 0
                for t in item.item.taxes:
                    tax+= (t.tax_rate/100)
                ordtax+= ((tax*price)*qty)
            taxdis =0
            for dis in i.discounts:                
                if dis.discount.type_id == 1:
                    od += dis.discount.value
                else:
                    taxdis += dis.discount.value/100
            od+=(taxdis*subtotal)
            inamount+= ((subtotal- od)+ordtax)


    for i in data:
        if i.type_id == 2:
            outnum+=1
            subtotal=0           
            ordtax = 0
            od=0
            for item in i.items:
                qty = item.quantity
                price = item.item.unit_price
                subtotal+= qty * price
                tax = 0
                for t in item.item.taxes:
                    tax+= (t.tax_rate/100)
                ordtax+=(tax*(price*qty))
            taxdis=0
            for dis in i.discounts:                
                if dis.discount.type_id == 1:
                    od += dis.discount.value
                else:
                    taxdis += dis.discount.value/100
            od+=(taxdis*subtotal)
            outamount+= ((subtotal- od)+ordtax)
           
    # Calculate by status

    # paid/settled order
    for i in data:        
        if i.status_id == 2:
            paidnum+=1
            subtotal=0
            od=0
            ordtax=0
            for item in i.items:
                qty = item.quantity
                price = float(item.item.unit_price)
                subtotal+= float(qty * price)
                tax=0            
                for t in item.item.taxes:
                    tax+= float((t.tax_rate/100))
                ordtax += (tax*(price*qty))
            taxdis =0
            for dis in i.discounts:                
                if dis.discount.type_id == 1:
                    od += float(dis.discount.value)
                else:
                    taxdis += float(dis.discount.value/100)
            od+=(taxdis*subtotal)
            totaldiscount+=od
            paid+= ((subtotal-od)+ordtax)
            gross+=subtotal
            totaltax+= ordtax

    for i in data:
        # open orders
        if i.status_id == 1:
            opennum+=1
            subtotal=0           
            ordtax=0
            od=0
            for item in i.items:
                qty = item.quantity
                price = float(item.item.unit_price)
                subtotal+= float(qty * price)
                # gross+=subtotal
                tax=0
                for t in item.item.taxes:
                    tax+= float((t.tax_rate/100))
                # totaltax+= 
                ordtax += (tax*(price*qty))
            taxdis =0
            for dis in i.discounts:                
                if dis.discount.type_id == 1:
                    od += float(dis.discount.value)
                else:
                    taxdis += float(dis.discount.value/100)
            od+=(taxdis*subtotal)
            # totaldiscount+=od
            open+= ((subtotal- od)+ordtax)

        # void orders
        if i.status_id == 3:
            voidnum+=1
            subtotal=0
            ordtax=0
            od=0
            for item in i.items:
                qty = item.quantity
                price = float(item.item.unit_price)
                subtotal+= float(qty * price)
                # gross+=subtotal
                tax=0
                for t in item.item.taxes:
                    tax+= float((t.tax_rate/100))
                # totaltax+= (tax*subtotal)
                ordtax += (tax*(price*qty)) 
            taxdis =0
            for dis in i.discounts:                
                if dis.discount.type_id == 1:
                    od += float(dis.discount.value)
                else:
                    taxdis += float(dis.discount.value/100)
            od+=(taxdis*subtotal)
            # totaldiscount+=od
            void+= ((subtotal-od)+ordtax)
        
        # refund
        if i.status_id == 4:
            refundnum+=1
            subtotal=0
            ordtax = 0
            od =0
            for item in i.items:
                qty = item.quantity
                price = float(item.item.unit_price)
                subtotal+= float(qty * price)
                # gross+=subtotal
                tax = 0
                for t in item.item.taxes:
                    tax+= float((t.tax_rate/100))
                # totaltax+= (tax*subtotal)
                ordtax+=(tax*(price*qty))
            taxdis =0
            for dis in i.discounts:                
                if dis.discount.type_id == 1:
                    od += float(dis.discount.value)
                else:
                    taxdis += float(dis.discount.value/100)
            od+=(taxdis*subtotal)
            # totaldiscount+=od
            refund+= ((subtotal-od)+ordtax)
        
        # pending
        if i.status_id == 5:
            pendnum +=1
            subtotal=0
            ordtax = 0
            od =0
            for item in i.items:
                qty = item.quantity
                price = float(item.item.unit_price)
                subtotal+= float(qty * price)
                # gross+=subtotal
                tax = 0
                for t in item.item.taxes:
                    tax+= float((t.tax_rate/100))
                    # totaltax+= (tax*subtotal)
                ordtax+=(tax*(price*qty))
            taxdis=0
            for dis in i.discounts:                
                if dis.discount.type_id == 1:
                    od += float(dis.discount.value)
                else:
                    taxdis += float(dis.discount.value/100)
            od+=(taxdis*subtotal)
            # totaldiscount+=od
            pend+= ((subtotal-od)+ordtax) 

    return {'openorders': opennum, 'open': open, 'voidorders': voidnum, 'void': void, 'paidorders': paidnum, 'paid': paid, 'refundorders': refundnum, 'refund': refund, 'pendingorders': pendnum, 'pend': pend, 'in': innum, 'inamount': inamount, 'out': outnum, 'outamount': outamount, 'gross': gross, 'discount': totaldiscount, 'tax': totaltax}

def chartOrders(orders, date1=0,date2=0,date3=0,date4=0,date5=0,date6=0,date7=0):
    taday = datetime.now().date()
    am = time(00,00,00)                
    pm = time(23, 59, 59)
    day1 = datetime.strftime(taday - timedelta(days=6), "%A")
    day2 = datetime.strftime(taday - timedelta(days=5), "%A")
    day3 = datetime.strftime(taday - timedelta(days=4), "%A")
    day4 = datetime.strftime(taday - timedelta(days=3), "%A")
    day5 = datetime.strftime(taday - timedelta(days=2), "%A")
    day6 = datetime.strftime(taday - timedelta(days=1), "%A")
    day7 = datetime.strftime(taday, "%A")    
    for order in orders:
        if datetime.combine(datetime.now().date(), am) <  order.date_created <datetime.combine(datetime.now().date(), pm):
            date1 +=1
        if datetime.combine(taday - timedelta(days=1), am) <  order.date_created <datetime.combine(taday - timedelta(days=1), pm):
            date2+=1
        if datetime.combine(taday - timedelta(days=2), am) <  order.date_created <datetime.combine(taday - timedelta(days=2), pm):
            date3+=1
        if datetime.combine(taday - timedelta(days=3), am) <  order.date_created <datetime.combine(taday - timedelta(days=3), pm):
            date4+=1
        if datetime.combine(taday - timedelta(days=4), am) <  order.date_created <datetime.combine(taday - timedelta(days=4), pm):
            date5+=1
        if datetime.combine(taday - timedelta(days=5), am) <  order.date_created <datetime.combine(taday - timedelta(days=5), pm):
            date6+=1
        if datetime.combine(taday - timedelta(days=6), am) <  order.date_created <datetime.combine(taday - timedelta(days=6), pm):
            date7+=1
    return {'data7':date1,'data6':date2,'data5':date3,'data4':date4,'data3':date5,'data2':date6,'data1':date7, 'day1':day1, 'day2':day2, 'day3':day3, 'day4':day4, 'day5':day5, 'day6':day6, 'day7':day7}


def render_to_pdf(html, css):
    if css is None:
        css = ['static/assets/css/bootstrap.min.css', 'static/assets/css/material-dashboard.css', 'static/assets/css/custom.css']   
    pdf=pdfkit.from_string(html, False, css=css, configuration=pdfconfig)
    if pdf:      
        return pdf
    return None
       
def printTicket(html, printer, css=[]):
    if printer is None:
        printer = win32print.GetDefaultPrinter()

    pdf = render_to_pdf(html, css=css)
    temp1 = mktemp('.pdf')
    f1 = open(temp1, 'ab')
    f1.write(pdf)
    f1.close()
    args = [
        "-dPrinted", "-dBATCH", "-dNOSAFER", "-dNOPAUSE", "-dNOPROMPT"
        "-q",
        "-dNumCopies#1",
        "-sDEVICE#mswinpr2",
        f'-sOutputFile#"%printer%{printer}"', 
        f'"{temp1}"'
    ]
    encoding = locale.getpreferredencoding()
    args = [a.encode(encoding) for a in args]
    ghostscript.Ghostscript(*args)
    
def getPrinters():
    allprinters = win32print.EnumPrinters(3)
    printers=[]
    for printer in list(allprinters):
            printers.append(list(printer))
    return  printers

def testPrint(printer):
    filename = mktemp (".txt")
    open (filename, "ab").write ("This is a test")
    win32api.ShellExecute (
    0,
    "print",
    filename,
    '/d:"%s"' % printer,
    ".",
    0
    )

  