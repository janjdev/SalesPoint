
import sys, os, io, collections, random, string, csv, tempfile, ast
from datetime import datetime, timedelta, time
from flask import Flask, request, redirect, render_template, session, url_for, abort, jsonify, flash
from flask.helpers import flash
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import event, DDL
from sqlalchemy.event import listen
from jinja2 import TemplateNotFound
from sqlalchemy.orm import backref
from sqlalchemy.sql.elements import Null
from sqlalchemy.sql.schema import ForeignKey
from werkzeug import datastructures
import werkzeug
from hashutil import make_pw_hash
from helpers import *
from mimetypes import MimeTypes
from werkzeug.utils import secure_filename
from collections import defaultdict
from sqlalchemy.exc import IntegrityError
from dateutil.tz import *


app = Flask(__name__)
app.config.from_pyfile(os.path.join(".", "config.py"), silent=False)
db = SQLAlchemy(app)
local = tzlocal()


class Customer(db.Model):
    __tablename__ = "customer"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=True)
    customer_orders = db.relationship('Order', backref='orders')
    
    def __init__(self, name=""):
        self.name = name

class Staff(db.Model):
    __tablename__ = "staff"
    id = db.Column(db.Integer, primary_key=True)
    first_name = db.Column(db.String(255), nullable = False)
    last_name = db.Column(db.String(255), nullable = False)
    staff_id = db.Column(db.NCHAR(6), nullable=False)
    id_updated = db.Column(db.Boolean)
    inactive_date = db.Column(db.Date, nullable=True)
    position_id = db.Column(db.Integer, db.ForeignKey('position.id'))
    role_id = db.Column(db.Integer, db.ForeignKey('role.id'))
    is_active = db.Column(db.Boolean)
    created_orders = db.relationship("Order", foreign_keys='Order.created_by_id')
    changed_orders = db.relationship("Order", foreign_keys='Order.last_changed_by_id')
    role = db.relationship('Staff_Role', backref='role')
    position = db.relationship('Staff_Position', backref="position")    

    def __init__(self, first_name, last_name, pos, role, stid, is_active=True, id_updated=False):
        self.first_name = first_name
        self.last_name = last_name
        self.staff_id = stid
        self.position_id = pos
        self.role_id = role
        self.is_active = is_active
        self.id_updated = id_updated
        

class Staff_Position(db.Model):
    __tablename__ = 'position'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column('type', db.String(50), nullable=False, unique=True)
    is_active = db.Column(db.Boolean, nullable=False)
    staff = db.relationship('Staff', backref='staffposition')     

    def __init__(self, name, is_active=True):
        self.name = name
        self.is_active = is_active

class Staff_Role(db.Model):
    __tablename__ = 'role'
    id = db.Column(db.Integer, primary_key=True)
    role_type = db.Column('type', db.String(50), nullable = False)
    staff = db.relationship('Staff', backref='staffrole')     

    def __init__(self, role_type):
        self.role_type = role_type



class Order(db.Model):
    __tablename__ = "order"
    id = db.Column(db.Integer, primary_key=True)
    type_id = db.Column(db.Integer, db.ForeignKey('order_type.id'), nullable=False)
    status_id = db.Column(db.Integer, db.ForeignKey('order_status.id'), nullable=False)
    date_created = db.Column(db.DateTime, nullable=False, default=datetime.now())
    date_last_changed = db.Column(db.DateTime, nullable=False, default=datetime.now())
    notes = db.Column(db.Text, nullable=True, default="")
    created_by_id = db.Column(db.Integer, db.ForeignKey('staff.id', ondelete='CASCADE'), nullable=False)
    last_changed_by_id = db.Column(db.Integer, db.ForeignKey('staff.id', ondelete='CASCADE'), nullable=True)
    chk_num = db.Column(db.Integer, nullable=True)
    customer_id = db.Column(db.Integer, db.ForeignKey('customer.id'), nullable=False)
    items = db.relationship('Order_Items', backref='items')
    discounts = db.relationship('Order_Discount', backref="discounts") 
    type = db.relationship('Order_Type', backref="type")          
    status = db.relationship('Order_Status', backref='order_status')
    tables = db.relationship('OrderTable', backref='ordertable')
    customer = db.relationship('Customer', backref='customerorder')
    createdby = db.relationship('Staff', foreign_keys='Order.created_by_id', backref='createdby')

    def __init__(self, type_id, created_by_id, chknum, notes="", customer_id=1, status=1, ):
        self.type_id = type_id
        self.created_by_id = created_by_id
        self.chk_num = chknum
        self.status_id = status        
        self.notes = notes
        self.customer_id = customer_id
       

class Order_Type(db.Model):
    __tablename__ = "order_type"
    id = db.Column(db.Integer, primary_key=True)
    order_type = db.Column(db.String(50), nullable = False, unique=True)
    type_of_order = db.relationship('Order', backref='order', lazy=True) 

    def __init__(self, order_type):
        self.order_type = order_type

class Order_Items(db.Model):
    __tablename__ = "order_items"
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('order.id', ondelete='CASCADE'), nullable=False)
    menu_item_id = db.Column(db.Integer, db.ForeignKey('menu_item.id', ondelete='CASCADE'), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    notes = db.Column(db.Text, nullable=True, default="")
    item = db.relationship('Menu_Item', backref="item")

    def __init__(self, orID, itID, qty, notes=""):
        self.order_id = orID 
        self.menu_item_id = itID
        self.quantity = qty
        self.notes = notes


class Order_Status(db.Model):
    __tablename__ = "order_status"    
    id = db.Column(db.Integer, primary_key=True)
    status = db.Column(db.String(20), nullable = False, unique=True)
    status_of_order = db.relationship('Order', backref='order_status', lazy=True) 

    def __init__(self, order_status):
        self.order_status = order_status

class Order_Discount(db.Model):
    __tablename__ = "order_discount"
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('order.id', ondelete='CASCADE'), nullable=False)
    discount_id = db.Column(db.Integer, db.ForeignKey('discount.id', ondelete='CASCADE'), nullable=False)
    discount = db.relationship('Discount', backref='discount', lazy=True)

    def __init__(self, order, discount):
        self.order_id = order
        self.discount_id = discount

class Discount(db.Model):
    __tablename__ = "discount"
    id = db.Column(db.Integer, primary_key=True)
    discount_name = db.Column(db.String(50), unique=True, nullable = False)
    type_id = db.Column(db.Integer, db.ForeignKey('discount_type.id', ondelete='CASCADE'), nullable=False)
    value = db.Column(db.Float(precision='3,2'), nullable=False)
    expir_date = db.Column(db.DateTime)
    is_active = db.Column(db.Boolean, nullable=False)
    no_expiry = db.Column(db.Boolean, nullable =True)
    discounttype = db.relationship('Discount_Type', backref='discounttype', lazy=True)    

    def __init__(self, name, dtype, value, exp, act=True, noexp=True):
        self.discount_name = name
        self.type_id = dtype
        self.value = value
        self.expir_date = exp
        self.is_active = act
        self.no_expiry = noexp                   

class Discount_Type(db.Model):
    __tablename__ = "discount_type"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(20), nullable=False, unique=True)
    
    def __init__(self, name):
        self.name = name

class Tax(db.Model):
    __tablename__ = "tax"
    id = db.Column(db.Integer, primary_key=True)
    tax_type = db.Column(db.String(20), nullable = False, unique=True)
    tax_rate = db.Column(db.Float(precision='3,2'), nullable=False)

    def __init__(self, tax, rate):
        self.tax_type = tax
        self.tax_rate = rate

class ItemTax(db.Model):
    __tablename__ = "item_tax"
    id = db.Column(db.Integer, primary_key=True)
    tax = db.Column(db.Integer, db.ForeignKey("tax.id", ondelete='CASCADE'), nullable=False)
    item = db.Column(db.Integer, db.ForeignKey("menu_item.id", ondelete='CASCADE'), nullable=False)

    def __init__(self, tax, item):
        self.tax = tax
        self.item = item
        
class Menu_Item(db.Model):
    __tablename__ = "menu_item"
    id = db.Column(db.Integer, primary_key=True)
    item_name = db.Column(db.String(50), unique=True, nullable = False)
    unit_price = db.Column(db.Float(precision='3,2'), nullable=False) 
    item_category = db.Column(db.Integer, ForeignKey('menu_category.id', ondelete='CASCADE'), nullable=False)  
    item_description = db.Column(db.Text, nullable=True, default="")   
    is_offered = db.Column(db.Boolean, nullable=False)
    is_special = db.Column(db.Boolean, nullable=True)
    special_item = db.relationship('Menu_Special', backref='special', lazy=True)
    item_image = db.relationship('Item_Image', backref='image', lazy=True)
    taxes = db.relationship('Tax', secondary='item_tax', backref='taxes', lazy=True)
    category = db.relationship('Menu_Category', backref="category", lazy=True)    
    

    def __init__(self, name, price, cat, descr="", is_offered=True, is_special=False):
        self.item_name = name
        self.unit_price = price
        self.item_category = cat
        self.item_description = descr
        self.is_offered = is_offered
        self.is_special = is_special

class Menu_Special(db.Model):
    __tablename__ = "special"
    id = db.Column(db.Integer, primary_key=True)
    menu_item_id = db.Column(db.Integer, db.ForeignKey('menu_item.id', ondelete='CASCADE'), nullable=False)
    has_entree = db.Column(db.Boolean, nullable = False)
    has_appetizer = db.Column(db.Boolean, nullable = False)
    has_soup = db.Column(db.Boolean, nullable = False)

    def __init__(self, item, entree, app, soup) :
        self.menu_item_id = item
        self.has_entree = entree
        self.has_appetizer = app
        self.has_soup = soup


class Menu_Category(db.Model):
    __tablename__ = 'menu_category'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column('category_name', db.String(50), nullable=False, unique=True)
    is_active = db.Column(db.Boolean, nullable=False)
    items = db.relationship('Menu_Item', backref='menu_item', lazy=True)     

    def __init__(self, name, is_active=True):
        self.name = name
        self.is_active = is_active        
   
class Item_Image(db.Model):
    __tablename__ = "image"
    id = db.Column(db.Integer, primary_key=True)
    filename = db.Column(db.Text, nullable=False)
    item_id = db.Column(db.Integer, db.ForeignKey('menu_item.id', ondelete='CASCADE'), nullable=True)
    path = db.Column(db.Text, nullable=False)

    def __init__(self, name, path, item_id):
        self.filename =name
        self.path = path
        self.item_id = item_id


class Table(db.Model):
    __tablename__ = "table"
    id = db.Column(db.Integer, primary_key=True)
    table_no = db.Column(db.Integer, unique=True)
    capacity = db.Column(db.Integer)
    description = db.Column(db.Text, nullable=True,)
    available = db.Column(db.Boolean, nullable=False)

    def __init__(self, no, cap=4, desc="", avail=True):
        self.table_no = no
        self.capacity = cap 
        self.description = desc
        self.available = avail

class OrderTable(db.Model):
    __tablename__ = "order_table"
    id = db.Column(db.Integer, primary_key=True)
    table = db.Column(db.Integer, ForeignKey("table.id", ondelete='CASCADE'), nullable=False)
    order = db.Column(db.Integer, ForeignKey("order.id",  ondelete='CASCADE'), nullable=False)
    tables = db.relationship('Table', backref='ordertables')

    def __init__(self, table, order):
        self.table = table
        self.order = order

class Printer(db.Model):
    __tablename__ = "printer"      
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable = False)
    printer =  db.Column(db.String(255), nullable = False)
    type_id = db.Column(db.Integer, db.ForeignKey('printer_type.id', ondelete='CASCADE'), nullable=False)
    ptype = db.relationship('Printer_Type', backref="ptype")

    def __init__(self, pname, printer, ptype):
        self.name = pname
        self.printer = printer
        self.type_id = ptype
    

class Printer_Type(db.Model):
    __tablename__ = "printer_type"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable = False)
    printer = db.relationship('Printer', backref='Printer', lazy=True)

    def __init__(self, name):
        self.name = name

class Order_Ticket(db.Model):
    __tablename__ = 'order_ticket'
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('order.id', ondelete='CASCADE'), nullable=False)
    created_on = db.Column(db.DateTime, nullable=False, default=datetime.now())
    status_id = db.Column(db.Integer, db.ForeignKey('ticket_status.id', ondelete='CASCADE'), nullable=False)
    closed_on = db.Column(db.DateTime, nullable=True)
    closed_by = db.Column(db.Integer, db.ForeignKey('staff.id', ondelete='CASCADE'), nullable=True)
    status = db.relationship('Ticket_Status', backref="ticketstatus")
    order = db.relationship('Order', backref="ticketorder")

    def __init__(self, orderid, statusid):
        self.order_id = orderid
        self.status_id = statusid     

class Ticket_Status(db.Model):
    __tablename__ ="ticket_status"
    id = db.Column(db.Integer, primary_key=True)
    status_type = db.Column(db.String(10), unique=True, nullable = False)

    def __init__(self, status):
        self.status_type = status


class Report_Type(db.Model):
    __tablename__ = 'report_type'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), unique=True, nullable = False)

    def __init__(self, name):
        self.name = name


class Report(db.Model):
    __tablename__ = 'report'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), unique=True, nullable = False)
    path = db.Column(db.Text, unique=True, nullable = False)
    type_id =  db.Column(db.Integer, db.ForeignKey('report_type.id', ondelete='CASCADE'), nullable=False)
    alias = db.Column(db.String(255), nullable = True)
    _type = db.relationship('Report_Type', backref='type')

    def __init__(self, name, path, type, alias):
        self.name = name
        self.path = path
        self.type_id = type
        self.alias = alias
   
      

event.listen(Customer.__table__, 'after_create', DDL(""" INSERT INTO customer (id, name) VALUES (1, 'Guest')"""))
event.listen(Staff_Role.__table__, 'after_create', DDL(""" INSERT INTO role (id, type) VALUES (1, 'administrator'),  (2, 'user') """))
event.listen(Staff_Position.__table__, 'after_create', DDL(""" INSERT INTO position (id, type, is_active) VALUES (1, 'manager', True),  (2, 'server', True) """))
event.listen(Order_Status.__table__, 'after_create', DDL(""" INSERT INTO order_status (id, status) VALUES (1, 'open'),  (2, 'settled'), (3, 'void'), (4, 'refund'), (5, 'pending') """))
event.listen(Order_Type.__table__, 'after_create', DDL(""" INSERT INTO order_type (id, order_type) VALUES (1, 'dine-in'),  (2, 'carry-out') """))
event.listen(Discount_Type.__table__, 'after_create', DDL(""" INSERT INTO discount_type (id, name) VALUES (1, 'Amount'),  (2, 'Percentage') """))
event.listen(Ticket_Status.__table__, 'after_create', DDL(""" INSERT INTO ticket_status (id, status_type) VALUES (1, 'Open'),  (2, 'Closed') """))
event.listen(Printer_Type.__table__, 'after_create', DDL(""" INSERT INTO printer_type (id, name) VALUES (1, 'report'),  (2, 'receipt'), (3, 'kitchen') """))
event.listen(Report_Type.__table__, 'after_create', DDL(""" INSERT INTO report_type (id, name) VALUES (1, 'report'),  (2, 'chart') """))




#==================Methods=================================================
def getItemImage(item_id):
    if Item_Image.query.filter(Item_Image.item_id == item_id).first():
        return  app.config['RELATIVE_PATH'] + Item_Image.query.filter(Item_Image.item_id == item_id).first().filename

# Get All Categories
def getCategory():
    cat = Menu_Category.query.all()
    return cat

def getActiveCat():
    cat = Menu_Category.query.filter(Menu_Category.is_active == True).all()
    return cat

#Paginate Active Catecories
def getPaginatedCat():
    page = request.args.get('page', 1, type=int)
    cat = Menu_Category.query.filter(Menu_Category.is_active == True).paginate(page, 2, False)
    return cat
    

# Get All Items
def getItems():
    i = Menu_Item.query.all()
    s = []
    for a in i:
        t = Menu_Category.query.filter_by(id = a.item_category).first()
        p = getItemImage(a.id)
        bb = {'item': a, 'cat': t.name}
        if p:
            bb['img'] = p
        s.append(bb)
    return s

# Get All Offered Items From Active Categories
def getOfferedItems():
    i = Menu_Item.query.filter(Menu_Item.is_offered == True).join(Menu_Category).filter(Menu_Category.is_active == True).all()   
    return i

# Paginate Offered Items
def paginatedItems():
    page = request.args.get('page', 1, type=int)
    i = Menu_Item.query.filter(Menu_Item.is_offered == True).join(Menu_Category).filter(Menu_Category.is_active == True).paginate(page, 6, False)
    return i

     
def getUser():
    return Staff.query.filter_by(id = session.get('id')).first()

#Get valid discounts
def getDiscounts():
    discounts = Discount.query.filter(Discount.is_active == True and Discount.expir_date > datetime.now() and Discount.no_expiry == True).all()
    return discounts

def exportTable(table, filename="table"):
    #create a csv file with the given filename
    outfile = open('./files/'+filename+'.csv', 'w', newline='')
    #create a writer to write to the file    
    outcsv = csv.writer(outfile, dialect='excel')
    #get the records from the table
    records = table.query.all()    
    #write the column header names
    [outcsv.writerow([column.name for column in table.__mapper__.columns])]
    #write the records
    [outcsv.writerow([getattr(curr, column.name) for column in table.__mapper__.columns]) for curr in records]
    outfile.close()

def importToSQL(file):
    try:
        file_name = file 
        data = Load_Data(file_name)
        for row in data:
            if row[0].isdigit() or Menu_Item.query.filter_by(item_name=row[0]).first() is not None or Menu_Item.query.filter_by(item_name=row[1]).first() is not None:
                item = db.Model
                if row[0].isdigit() or Menu_Item.query.filter_by(item_name=row[1]).first() is not None:              
                    if row[0].isdigit():
                        item = Menu_Item.query.filter_by(id=row[0]).first()
                    else:
                        item = Menu_Item.query.filter_by(item_name = row[1]).first()                       
                    item.item_name = row[1]                               
                    item.unit_price = row[2]                                                       
                    if row[3].isdigit():
                        item.item_category = row[3]                                               
                    else: 
                        exists = db.session.query(Menu_Category.id).filter_by(name=row[3].capitalize()).scalar() is not None
                        if exists:
                            item.item_category = Menu_Category.query.filter_by(name = row[3].capitalize()).first().id                           
                        else: 
                            newcat =  Menu_Category(row[3].capitalize())
                            db.session.add(newcat)
                            item.item_category = newcat.id      
                    if row[4] != '':
                        item.item_description = row[4]
                    if row[5] != '':
                        if row[5] == "FALSE":
                            item.is_offered = False
                    if row[6] != '':
                        if row[6] == "FALSE":
                                item.is_special = False
                else:
                    if Menu_Item.query.filter_by(item_name=row[0]).first() is not None:
                        item = Menu_Item.query.filter_by(item_name = row[0]).first()
                        item.item_name = row[0]              
                        item.unit_price = row[1]             
                        if row[2].isdigit():
                            item.item_category = row[2]
                        else:
                            exists = db.session.query(Menu_Category.id).filter_by(name=row[2].capitalize()).scalar() is not None                            
                            if exists: 
                                cat = Menu_Category.query.filter_by(name = row[2].capitalize()).first().id                          
                                row[2] = cat              
                            else: 
                                newcat =  Menu_Category(row[2].capitalize())
                                db.session.add(newcat)
                                db.session.commit()
                                item.item_category = newcat.id
                        if row[3] != '':
                            item.item_description = row[3]
                        if row[4] != '':
                            if row[4] == "FALSE":
                                item.is_offered = False
                        if row[5] != '':
                            if row[5] == "FALSE":
                                item.is_special = False          
            else:
                if row[0] == '':                                                      
                    price = row[2]                   
                    row[2]  = price                                      
                    if not (row[3].isdigit()):                                              
                        exists = db.session.query(Menu_Category.id).filter_by(name=row[3].capitalize()).scalar() is not None                        
                        if exists: 
                            cat = Menu_Category.query.filter_by(name = row[3].capitalize()).first().id             
                            row[3] = cat
                        else: 
                            newcat =  Menu_Category(row[3].capitalize(),  True)                       
                            db.session.add(newcat)                            
                            db.session.commit()                           
                            row[3] = newcat.id                                              
                    record = Menu_Item(row[1], row[2], row[3], row[4])
                    db.session.add(record) #Add all the records
                if row[0] != '':
                    price = row[1]                  
                    row[1]  = price                                      
                    if not (row[2].isdigit()):                                              
                        exists = db.session.query(Menu_Category.id).filter_by(name=row[2].capitalize()).scalar() is not None                        
                        if exists: 
                            cat = Menu_Category.query.filter_by(name = row[2].capitalize()).first().id                      
                            row[2] = cat
                        else: 
                            newcat =  Menu_Category(row[2].capitalize(),  True)                                                
                            db.session.add(newcat)                            
                            db.session.commit()                                                    
                            row[2] = newcat.id
                    record = Menu_Item(row[0], row[1], [2], row[3])
                    db.session.add(record) #Add all the records
        db.session.commit() #Attempt to commit all the records
    except Exception as e:
        db.session.rollback() #Rollback the changes on error
        print(e)
        return -3
    finally:
        print('final')
        db.session.close() #Close the connection

# =======================PRINTING FUNCTIONS=================================
def sendToPrint(template, id, printerid=None):
    if printerid is None:
        printerid = 3 
    order = Order.query.filter_by(id=id).first()
    html = render_template(template, order=order, term=getTerminal())

    try:
        printer = Printer.query.filter_by(type_id = printerid).first().printer       
    except:
        printer = None
    try:
        printTicket(html, ['static/assets/css/tickets/ticket.css'], printer)            
    except Exception as e:
        print(str(e))
#======================ROUTES==============================================
@app.route('/', methods=['GET', 'POST'] )
def home():
    getURL()
    try:        
        return render_template('screens/window_main.html', title="SalesPoint - Version 1.0-build 1.0.1", bodyClass='main_window')
    except TemplateNotFound:
        abort(404)

@app.route('/auth', methods=['GET', 'POST'])
def auth():
    return render_template('screens/auth.html', title="Authorizations", bodyClass='dashboard')

@app.route('/shut-down', methods=['GET', 'POST'])
def shut_down():
    shutdown = request.environ.get('werkzeug.server.shutdown')
    if request.method == 'POST':
        if 'admin' in request.form: 
            if shutdown is None:
                raise RuntimeError('The function is not available')
            else:
                shutdown()   
                return jsonify({'status': 'success', 'message': 'Shutting Down...', 'alertType': 'success', 'timer': 500, 'callback': 'shutdown'})
        elif 'id' in request.form:
            ID = request.form['id']
            checkpass = make_pw_hash(ID, "Mamihlapinatapei") 
            staff = Staff.query.filter_by(staff_id = checkpass).first()
            if staff.role_id == 1:
                return jsonify({'status': 'success', 'message': 'Shutting Down...', 'alertType': 'success', 'timer': 500, 'callback': 'shutdown'})
            else:
                return jsonify({'status': 'error', 'message': 'Permission Restricted', 'alertType': 'error', 'timer': 2500})
        else:
             return jsonify({'status': 'error', 'message': 'Permission Restricted', 'alertType': 'error', 'timer': 2500})
    if request.method == 'GET':
        if session.get('role') == 'Administrator':
            if shutdown is None:
                raise RuntimeError('The function is not available')
            else:
                shutdown()
                return redirect(url_for('logout'))  
        return redirect(url_for('logout'))
    


@app.route('/logout')
def logout():   
    session.clear()
    return redirect(url_for('home'))

@app.route('/exportmenu', methods=['Get', 'POST'])
def export():
  exportTable(Menu_Item, 'menu')
  return redirect(request.referrer)

@app.route('/importmenu', methods=['POST'])
def importTable():
    print(request.files)
    if 'importfile' in request.files:
        file = request.files['importfile']
        filename = secure_filename(file.filename)        
        file.save(os.path.join(app.config['IMPORTS'], filename))
        filepath = os.path.join(app.config['IMPORTS'], filename)
        # try:     
        importToSQL(filepath)
        #     return jsonify({'status': 'success', 'alertType': 'success', 'timer': 500,})
        # except:
        #     return jsonify({'status': 'Could not import all items. Check that the form is in the correct format. See "help" for more information', 'alertType': 'error', 'timer': 2500,})

        


#====================================Customers==================================

@app.route('/customer', methods=['POST'])
def customer():
    if 'id' in session:
        if request.method == 'POST':
            cname = request.form['cname']
            newCust = Customer(cname)
            db.session.add(newCust)
            db.session.commit()
            return jsonify({'status': 'success', 'alertType': 'success', 'timer': 500, 'callback': 'newCust'})
        return redirect(url_for('carry_out'))
    return redirect(url_for('logout'))

@app.route('/edit_cust/<int:user_id>', methods=['POST'])
def edit_cust(user_id):
    if 'id' in session:
        if request.method == 'POST':
            customer = Customer.query.filter_by(id = user_id).first()
            if 'delete' in request.form:
                corders = Order.query.filter(Order.customer_id == user_id and Order.status_id == 1).all()
                if len(corders) > 0:
                    return jsonify({'status': 'error', 'message': 'Cannot delete customers with open orders. Settle orders before trying again' , 'alertType': 'warning', 'timer': 2500, 'callback': 'newCust'})
                else:
                    db.session.delete(customer)             
            else:         
                cname = request.form['cname']
                customer.name = cname
            db.session.commit()
            return jsonify({'status': 'success', 'alertType': 'success', 'timer': 500, 'callback': 'newCust'})
        return redirect(url_for('carry_out'))
    return redirect(url_for('logout'))

#======================================Orders========================================================

@app.route('/dine-in', methods=['GET', 'POST'])
def dine_in():
    if request.method == 'POST':
        ID = request.form['staffID']
        checkpass = make_pw_hash(ID, "Mamihlapinatapei") 
        staff = Staff.query.filter_by(staff_id = checkpass).first()
        if staff:
            if staff.role_id < 3:              
                session['id'] = staff.id
                if staff.role_id == 1:
                   session['role'] = "Administrator"                         
                return jsonify({'status': 'success', 'alertType': 'success', 'timer': 500, 'callback': 'goTo', 'param': url_for('dine_in')})
            else:
                return jsonify({'status': 'error', 'message': 'No Permission', 'alertType': 'error'})
        else:
            return jsonify({'status': 'error', 'message': 'ID Not Found', 'alertType': 'error'})
    if 'id' in session:
        staff = Staff.query.filter_by(id = session.get('id')).first()
        customers = Customer.query.filter(Customer.id > 1).all()                 
        return render_template('tasks/pages/new_order.html', title="SalesPoint - Version 1.0-build 1.0.1", bodyClass='shared-tasks dinein', images=getImages(), date=getDate(), user=staff, ordertype="Dine-In", orderstatus="New Ticket", cat=getActiveCat(), items=getOfferedItems(), orderstatusID=1, ordertypeID=1, customers=customers, taxes=Tax.query.all(), tables=Table.query.all(), typeclass="dine-in", discounts=getDiscounts())
    return redirect(url_for('logout'))


@app.route('/carry-out', methods=['GET', 'POST'])
def carry_out():
    if request.method == 'POST':
        ID = request.form['staffID']
        checkpass = make_pw_hash(ID, "Mamihlapinatapei") 
        staff = Staff.query.filter_by(staff_id = checkpass).first()
        if staff:
            if staff.role_id < 3:              
                session['id'] = staff.id
                if staff.role_id == 1:
                   session['role'] = "Administrator"                         
                return jsonify({'status': 'success', 'alertType': 'success', 'timer': 500, 'callback': 'goTo', 'param': url_for('carry_out')})
            else:
                return jsonify({'status': 'error', 'message': 'No Permission', 'alertType': 'error'})
        else:
            return jsonify({'status': 'error', 'message': 'ID Not Found', 'alertType': 'error'})
    if 'id' in session:
        staff = Staff.query.filter_by(id = session.get('id')).first()
        customers = Customer.query.filter(Customer.id > 1).all()                 
        return render_template('tasks/pages/new_order.html', title="SalesPoint - Version 1.0-build 1.0.1", bodyClass='shared-tasks', images=getImages(), date=getDate(), user=staff, ordertype="Carry-Out", orderstatus="New Ticket", cat=getActiveCat(), items=getOfferedItems(), orderstatusID=1, ordertypeID=2, customers=customers, taxes=Tax.query.all(), typeclass="carry-out", tables=Table.query.all(), discounts=getDiscounts())
    return redirect(url_for('logout'))


@app.route('/order/', methods=['POST'])
def order():
    if 'id' in session:        
        if request.method == 'POST':
            try:               
                status = request.form['orderstatus']
                i = request.form['items']
                items = multiRow(i)
                order = Order
                td=0
                q = request.form['orderid'] == ''
                if q is False:
                    order = Order.query.filter_by(id = request.form['orderid']).first()
                    td = order.id
                    order.status_id = request.form['orderstatus']
                    order.notes = request.form['notes']
                    order.last_changed_by_id = session.get('id')
                    order.date_last_changed = datetime.now()                    
                    # update order ticket or create new ticket
                    if Order_Ticket.query.filter_by(order_id = order.id).first() is not None:
                        ot =  Order_Ticket.query.filter_by(order_id = order.id).first()
                        ot.status = Ticket_Status.query.filter_by(id = 1).first()
                        ot.closed_on = None
                    else:
                        ot = Order_Ticket(order.id, 1)                
                    # remove all previous items
                    Order_Items.query.filter_by(order_id = order.id).delete()
                    # remove all previous discounts
                    Order_Discount.query.filter_by(order_id = order.id).delete()
                    # remove all previous tables assigned
                    OrderTable.query.filter_by(order = order.id).delete()
                    db.session.commit()
                    for item in items:
                        if 'itemname' in item.keys():
                            itemname = item['itemname'].title()                    
                            if Menu_Item.query.filter_by(item_name = itemname).first() is not None:                        
                                db.session.rollback()
                                db.session.commit()
                                return jsonify({'status': 'success', 'message':  itemname + ' already exist. Please use the current item from the Menu.', 'alertType': 'warning', 'timer': 6000}) 
                            else:                        
                                newmenuitem = Menu_Item(itemname, item['price'], 0)
                                db.session.add(newmenuitem)
                                db.session.commit()                 
                                taxes = item['taxes']
                                for tax in taxes:
                                    newit = ItemTax(int(tax), newmenuitem.id)
                                    db.session.add(newit)
                                    db.session.commit()
                                neworderitem = Order_Items(order.id, newmenuitem.id, item['qty'], item['itemnote'])
                                db.session.add(neworderitem)                    
                        else:
                            newitem = Order_Items(order.id, item['item'], item['qty'], item['itemnote'])
                            db.session.add(newitem)
                                           
                    if 'ordertable' in request.form.keys():
                        tables = request.form.getlist('ordertable')            
                        for table in tables:
                            if status == '1':
                                t = Table.query.filter_by(id = table).first()
                                t.available = False;                               
                            ordertable = OrderTable(table, order.id)
                            db.session.add(ordertable)
                    if 'orderdiscount' in request.form.keys():
                        discounts = request.form.getlist('orderdiscount')
                        for discount in discounts:
                            od = Order_Discount(order.id, discount)
                            db.session.add(od)
                else:                             
                    neworder = Order(request.form['ordertype'], session.get('id'), request.form['chknum'], request.form['notes'], request.form['customer'],  request.form['orderstatus'] )
                    db.session.add(neworder)
                    db.session.commit()
                    orderID = neworder.id
                    td = neworder.id
                    ot=Order_Ticket(orderID, 1) 
                    db.session.add(ot)
                    for item in items:
                        if 'itemname' in item.keys():
                            itemname = item['itemname'].title()                    
                            if Menu_Item.query.filter_by(item_name = itemname).first() is not None:                        
                                db.session.rollback()
                                db.session.delete(neworder)
                                db.session.commit()
                                return jsonify({'status': 'success', 'message':  itemname + ' already exist. Please use the current item from the Menu.', 'alertType': 'warning', 'timer': 6000}) 
                            else:                        
                                newmenuitem = Menu_Item(itemname.title(), item['price'], 0)
                                db.session.add(newmenuitem)
                                db.session.commit()
                                neworderitem = Order_Items(orderID, newmenuitem.id, item['qty'], item['itemnote'])
                                db.session.add(neworderitem)  
                                taxes = item['taxes']
                                for tax in taxes:
                                    newit = ItemTax(tax, newmenuitem.id)
                                    db.session.add(newit)
                                    db.session.commit()                 
                        else:    
                            newitem = Order_Items(orderID, item['item'], item['qty'], item['itemnote'])
                            db.session.add(newitem)
                            db.session.commit()  
                    if 'ordertable' in request.form.keys():
                        tables = request.form.getlist('ordertable')            
                        for table in tables:
                            if status == '1':
                                t = Table.query.filter_by(id = table).first()
                                t.available = False;                               
                            ordertable = OrderTable(table, orderID)
                            db.session.add(ordertable)
                    if 'orderdiscount' in request.form.keys():
                        discounts = request.form.getlist('orderdiscount')
                        for discount in discounts:
                            od = Order_Discount(orderID, discount)
                            db.session.add(od)
                db.session.commit()
                sendToPrint('/kitchenticket/ticket.html', td, 3)     
                if  status == '1':                
                    return jsonify({'status': 'success', 'alertType': 'success', 'timer': 500, 'callback': 'goTo', 'param': url_for('orders') })
                else:
                    return jsonify({'status': 'success', 'alertType': 'success', 'timer': 500, 'callback': 'clearOrder'})
            except Exception as e:
                print(e)
                db.session.rollback()
                return jsonify({'status': 'error', 'message': 'Internal System Error ' + str(e), 'alertType': 'error'})         
    return redirect(url_for('logout'))

@app.route('/orders', methods=['GET', 'POST'])
def orders():
    if request.method == 'POST':
        ID = request.form['staffID']
        checkpass = make_pw_hash(ID, "Mamihlapinatapei") 
        staff = Staff.query.filter_by(staff_id = checkpass).first()
        if staff: 
            if staff.role_id < 3:                       
                session['id'] = staff.id
                if staff.role_id == 1:
                   session['role'] = "Administrator"              
                return jsonify({'status': 'success', 'alertType': 'success', 'timer': 500, 'callback': 'goTo', 'param': '/orders'})
            else:
                return jsonify({'status': 'error', 'message': 'Permission Restricted', 'alertType': 'error'})
        else:
            return jsonify({'status': 'error', 'message': 'ID Not Found', 'alertType': 'error'})    
    if 'id' in session:
        if session.get('role') == 'Administrator':
            allorders = Order.query.all()
        else:
            allorders = Order.query.filter_by(created_by_id = session.get('id')).all()
        return render_template('tasks/pages/orders.html', title="SalesPoint - Version 1.0-build 1.0.1", bodyClass='shared-tasks orders', date=getDate(), user=getUser(), orders=allorders, cardtitle='Orders')
    return redirect(url_for('logout'))

@app.route('/settle/<int:orderid>', methods=['POST'])
def settle(orderid):
    if 'id' in session:
        if request.method == 'POST':
            return render_template('tasks/pages/settle.html', title="SalesPoint - Version 1.0-build 1.0.1", bodyClass='shared-tasks', date=getDate(), user=getUser(), order=Order.query.filter_by(id = orderid).first())
    return redirect(url_for('logout'))

@app.route('/staus/<int:orderid>', methods=['POST'])
def ordertatus(orderid):
    if 'id' in session:
        if request.method == 'POST': 
            order = Order.query.filter_by(id = orderid).first()              
            if request.form['action'] == 'void' or request.form['action'] == 'refund':
                if session.get('role') == "Administrator":
                    if request.form['action'] == 'void':
                        if order.status_id == 1 or order.status_id == 5:
                            order.status_id = 3
                        else:
                            return jsonify({'status': 'error', 'message': 'Only open or pending orders can be voided', 'alertType': 'error', 'timer': 2500})
                    if request.form['action'] == 'refund':
                        if order.status_id == 2:
                            order.status_id == 4
                        else:
                            return jsonify({'status': 'error', 'message': 'Only settled orders can be refunded', 'alertType': 'error', 'timer': 2500})
                else:
                    return jsonify({'status': 'error', 'message': 'Action requires Administrative Permissions', 'alertType': 'error', 'timer': 2500})
            if request.form['action'] == 'settle':
                if order.status_id == 1:
                    order.status_id = 2
                else:
                    return jsonify({'status': 'error', 'message': 'Only Open orders can be settled.', 'alertType': 'error', 'timer': 2500})
            
            if order.type_id == 1:
                for table in order.tables:
                    t = Table.query.filter_by(id = table.table).first()
                    t.available = True
            db.session.commit()
            return jsonify({'status': 'success', 'alertType': 'success', 'timer': 500, 'callback': 'updateOrders'})
    return redirect(url_for('logout'))
    
@app.route('/reopen/<int:orderid>', methods=['GET'])
def reopen(orderid):
    if 'id' in session:
        staff = Staff.query.filter_by(id = session.get('id')).first()
        customers = Customer.query.filter(Customer.id > 1).all()
        order = Order.query.filter_by(id = orderid).first()                 
        return render_template('tasks/pages/new_order.html', title="SalesPoint - Version 1.0-build 1.0.1", bodyClass='shared-tasks', images=getImages(), date=getDate(), user=staff, ordertype=order.type.order_type, orderstatus="Edit Ticket", cat=getActiveCat(), items=getOfferedItems(), orderstatusID=order.status_id, ordertypeID=order.type_id, customers=customers, taxes=Tax.query.all(), order=order, typeclass=order.type.order_type, discounts=getDiscounts())
    return redirect(url_for('logout'))


@app.route('/kitchen', methods=['GET', 'POST'])
def kitchen():
    if request.method == 'POST':
        ID = request.form['staffID']
        checkpass = make_pw_hash(ID, "Mamihlapinatapei") 
        staff = Staff.query.filter_by(staff_id = checkpass).first()
        if staff:
            if staff.role_id < 3:              
                session['id'] = staff.id
                if staff.role_id == 1:
                    session['role'] = "Administrator"                         
                    return jsonify({'status': 'success', 'alertType': 'success', 'timer': 500, 'callback': 'goTo', 'param': url_for('kitchen')})
            else:
                return jsonify({'status': 'error', 'message': 'Permission Restricted', 'alertType': 'error'})
        else:
            return jsonify({'status': 'error', 'message': 'ID Not Found', 'alertType': 'error'})
    if 'id' in session:
        return render_template('tasks/pages/ordertickets.html', title="SalesPoint - Version 1.0-build 1.0.1", bodyClass='shared-tasks tickets', images=getImages(), date=getDate(), user=getUser(), tickets=Order_Ticket.query.filter_by(status_id = 1).all())
    return redirect(url_for('logout'))

@app.route('/orderticket/<int:ticketid>', methods=["POST"])
def orderticket(ticketid):
    if 'id' in session:
        if request.method == 'POST':
            ot = Order_Ticket.query.filter_by(id=ticketid).first()
            ot.status_id = 2
            ot.closed_on = datetime.now()
            ot.closed_by = session.get('id')
            db.session.commit()
            return jsonify({'status': 'success', 'alertType': 'success', 'timer': 500, 'callback': 'reload'})
    return redirect(url_for('logout'))

@app.route('/orderview/<int:id>', methods=["POST"])
def orderview(id):
    if 'id' in session:       
        ot = Order.query.filter_by(id=id).first()
        return jsonify({'data': render_template('/reports/orderticket.html', order=ot, term=getTerminal(), currenttime=datetime.now()), 'callback': 'sendToPrint'})
    return redirect(url_for('logout'))
#=================================================Configurations====================================================

@app.route('/admin', methods=['GET', 'POST'])
def admin():
    if request.method == 'POST':       
        ID = request.form['staffID']
        checkpass = make_pw_hash(ID, "Mamihlapinatapei")
        staff = Staff.query.filter_by(staff_id = checkpass).first()
        if staff:                   
            if staff.role_id == 1:
                session['role'] = "Administrator"
                session['id'] = staff.id                
                return jsonify({'status': 'success', 'alertType': 'success', 'timer': 1000, 'callback': 'goTo', 'param': url_for('admin')})
            else:
                return jsonify({'status': 'error', 'message': 'Permission restricted', 'alertType': 'error'})        
        return jsonify({'status': 'error', 'message': 'ID Not Found', 'alertType': 'error'})
    if request.method == 'GET':
        if 'id' in session:
            if session.get('role') == 'Administrator':
                user = Staff.query.filter_by(id = session.get('id')).first()
                am = time(00,00,00)                
                pm = time(23, 59, 59)
                morning = datetime.combine(datetime.now().date(), am)
                evening = datetime.combine(datetime.now().date(), pm)               
                orders=Order.query.filter(Order.date_created.between(morning, evening)).all()                         
                return render_template('admin/dash/pages/dash.html', title="SalesPoint - Version 1.0-build 1", bodyClass='dashboard', orders=orders, time=datetime.now().strftime("%I:%M%Z"), daynight=datetime.now().strftime("%p"), user=user, date=getDate(), role=session.get('role'), cats=getActiveCat(), taxes=Tax.query.all(), printertypes=Printer_Type.query.all(), chart=chartOrders(Order.query.all()), printers=getPrinters())
    return redirect(url_for('home'))


@app.route('/config', methods=['GET'])
def config():
    if session.get('role') == 'Administrator':
        user = Staff.query.filter_by(id = session.get('id')).first()
        printertypes = Printer_Type.query.all()
        return render_template('admin/dash/pages/config.html', title="SalesPoint - Version 1.0-build 1", bodyClass='config', fonts=getFonts(), config_active='active', config_show='show', config_expand='true', admin_active='active', date=getDate(), role=session.get('role'), user=user, printertype = printertypes, info = getBusInfo(), term = getTerminal(), devices=getPrinters(), setprinters=Printer.query.all())
    return redirect(url_for('home'))


@app.route('/bus', methods=['POST'])
def get_bus():
    if session.get('role') == "Administrator":
        if (request.method=='POST'):
            setBusInfo(request.form['name'], request.form['phone'], request.form['add'], request.form['city'], request.form['st'], request.form['zip'])
            return jsonify({'message': 'OK', 'alertType': 'success', 'timer': 500, 'callback': 'loadElement', 'param' : 'businfo'})
        else:
            return redirect(url_for('config'))
    else:
        return redirect(url_for('logout'))


@app.route('/term', methods=['POST'])
def get_term():
    if session.get('role') == "Administrator":
        if (request.method == 'POST'):
            print(request.form)
            log = False
            if 'autolog' in request.form:
                log = request.form['autolog']
            font = None
            if 'defaultfont' in request.form:
                font = request.form['defaultfont']            
            setTerminal(request.form['id'], request.form['location'], log, request.form['timer'], font, request.form['fontpath'])
            return jsonify({'message': 'OK', 'alertType': 'success', 'timer': 500, 'callback': 'loadElement', 'param' : 'terminal'})
        else:
            return redirect(url_for('config'))
    else:
        return redirect(url_for('logout'))  

@app.route('/printers', defaults={'id': None}, methods=['POST'])
@app.route('/printers/<int:id>',  methods=['POST'])
def printer(id):
    if session.get('role') == "Administrator":
        if (request.method == 'POST'):
            print(request.form)
            if id is not None or 'action' in request.form:
                printer = Printer.query.filter_by(id = id).first()
                if printer:
                    if request.form['action'] == 'delete':
                        db.session.delete(printer)
                        db.session.commit()
                        return jsonify({'message': 'OK', 'alertType': 'success', 'timer': 500, 'callback': 'loadTable'})
                    else:
                        printer.name = request.form['printername']
                        printer.printer = request.form['device']
                        printer.type_id = request.form['printertype']
                        db.session.commit()
                        return jsonify({'message': 'OK', 'alertType': 'success', 'timer': 500, 'callback': 'loadTable'})
                else: return jsonify({'message': 'No Printer set for action.', 'alertType': 'error', 'timer': 2500, 'callback': 'loadTable'})
            else:
                printer = Printer(request.form['printername'], request.form['device'], request.form['printertype'])        
                db.session.add(printer)
            try:
                db.session.commit()    
                return jsonify({'message': 'OK', 'alertType': 'success', 'timer': 500, 'callback': 'loadTable'})
            except IntegrityError:
                db.session.rollback()
                return jsonify({'status': 'error', 'message': 'A printer with that name already exist.', 'alertType': 'error', 'timer': 2500})
            except Exception as e:
                db.session.rollback()
                return jsonify({'status': 'error', 'message': 'Internal System Error ' + str(e), 'alertType': 'error', 'timer': 2500})
        else:
            return redirect(url_for('config'))
    else:
        return redirect(url_for('logout'))

@app.route('/test_print/<int:id>', methods=['POST'])
def printerTest(id):
    if session.get('role') == "Administrator":
        if (request.method == 'POST'):
            if id is not None:
                printer = Printer.query.filter_by(id = id).first().printer
                try:
                    testPrint(printer)
                    return jsonify({'message': 'OK', 'alertType': 'success', 'timer': 500, 'callback': 'loadTable'})
                except Exception as e:
                    return jsonify({'message': 'Could Not Reach Printer. '+'\n' + str(e), 'alertType': 'error', 'timer': 2500, 'callback': 'loadTable'})
            return jsonify({'message': 'Could Not Reach Printer.', 'alertType': 'error', 'timer': 2500, 'callback': 'loadTable'})
        else:
             return redirect(url_for('logout'))
#=======================================Staff Functions=========================================

@app.route('/staff', methods=['POST', 'GET'])
def staff():
    roles = Staff_Role.query.all()
    pos = Staff_Position.query.all()
    staff = Staff.query.order_by(Staff.last_name.asc()).all()
    stObj = []
    for s in staff:
        st = {}
        st['posID'] = Staff_Position.query.filter_by(id=s.position_id).first().name
        st['rolID'] = Staff_Role.query.filter_by(id=s.role_id).first().role_type        
        st['staff'] = s
        stObj.append(st)
    user = Staff.query.filter_by(id = session.get('id')).first()
    return render_template('/admin/dash/pages/staff.html', title="SalesPoint - Version 1.0-build 1", tablename="STAFF MANAGEMENT", bodyClass="staff", roles=roles, pos=pos, staff=stObj, mng_staff_active='active', staff_active='active', config_active='active', config_expand='true', staff_expand='true', config_show='show', mng_staff_show='show', date=getDate(), role=session.get('role'), user=user )

@app.route('/staff/add', methods=['POST', 'GET'])
def add_staff():
    if session.get('role') == 'Administrator':
        if request.method == 'POST':
            fname = request.form['fname']
            lname = request.form['lname']
            pos = request.form['position']
            role = request.form['role']
            passw = ''.join([random.choice(string.digits) for x in range(6)])
            q = "Mamihlapinatapei"
            make_pw_hash(passw, q)
            newHire = Staff(fname, lname, pos, role,  make_pw_hash(passw, q))
            db.session.add(newHire)
            db.session.commit()
            return jsonify({'title':'Staff ID', 'message': 'ID for Staff ' + fname +' ' + lname +'\n' + passw, 'alertType': 'success', 'callback': 'loadStaffTable'})
        return redirect(url_for('staff'))
    return redirect(url_for('logout'))

@app.route('/staff/pw/<int:id>', methods=['POST'])
def chnpw(id):
    if session.get('role') == 'Administrator':
        if request.method == 'POST': 
            staff = Staff.query.filter_by(id = id).first()
            if staff:
                passw = ''.join([random.choice(string.digits) for x in range(6)])
                q = "Mamihlapinatapei"
                staff.staff_id = make_pw_hash(passw, q)
                db.session.commit()
                return jsonify({'title':'Staff ID', 'message': 'ID for Staff: ' + staff.first_name +' ' + staff.last_name +'\n' + passw, 'alertType': 'success'})
        return redirect(url_for('staff'))
    return redirect(url_for('logout'))


@app.route('/staff/edit/<int:user_id>', methods=['POST'])
def edit_staff(user_id):
    if session.get('role') == 'Administrator':
        if request.method == 'POST':
            if 'delete' in request.form:
                y = str(session.get('id')) == request.form['delete']              
                if y == True:                   
                    return jsonify({'status': 'error', 'message': 'User Logged In', 'alertType': 'error', 'timer': 3500})
                else:
                    st = Staff.query.filter_by(id = request.form['delete']).first()
                    stod = Order.query.filter(Order.created_by_id == st.id).first() is not None
                    if stod:
                        od =  Order.query.filter(Order.created_by_id == st.id).order_by(Order.date_created.desc()).first()
                        now =  datetime.now()
                        exp = now - timedelta(days=30)                  
                        if od.date_created > exp:
                            return jsonify({'status': 'error', 'message': 'User has activity in the last 30 days', 'alertType': 'error', 'timer': 3500})
                    else:
                        db.session.delete(st)
                        db.session.commit()
                        return jsonify({'message': 'OK', 'alertType': 'success', 'timer': 500, 'callback': 'loadStaffTable'})
            elif 'inactive' in request.form:
                y = str(session.get('id')) == request.form['inactive']              
                if y == True:                   
                    return jsonify({'status': 'error', 'message': 'User Logged In', 'alertType': 'error', 'timer': 500})
                else:
                    Staff.query.filter_by(id = request.form['inactive']).first().is_active = False
                    Staff.query.filter_by(id = request.form['inactive']).first().inactive_date = datetime.now().date()
                    db.session.commit()
                    return jsonify({'message': 'OK', 'alertType': 'success', 'timer': 500, 'callback': 'loadStaffTable'})                    
            elif 'active' in request.form:
                print(type(request.form['active']))    
                Staff.query.filter_by(id = request.form['active']).first().is_active = True
                Staff.query.filter_by(id = request.form['active']).first().inactive_date =None
                db.session.commit()
                return jsonify({'message': 'OK', 'alertType': 'success', 'timer': 500, 'callback': 'loadStaffTable'})           
            else:
                user = Staff.query.filter_by(id = user_id).first()
                user.first_name = request.form['fname']
                user.last_name = request.form['lname']
                user.position_id = request.form['position']
                user.role_id = request.form['role']
                if 'status' in request.form:
                    user.is_active = True
                else:
                    user.is_active = False   
                db.session.commit()
                return jsonify({'message': 'OK', 'alertType': 'success', 'timer': 5000, 'callback': 'goTo', 'param' : url_for('staff')})
        else:
            return redirect(url_for('staff'))
    return redirect(url_for('logout'))
    

@app.route('/staff/positions', methods=['POST', 'GET'])
def positions():
    if session.get('role') == 'Administrator':
        if request.method == 'GET':
            positions = []
            ps = Staff_Position.query.order_by(Staff_Position.name.asc()).all()
            for p in ps:
                nn = Staff.query.filter_by(position_id = p.id).count()
                pp = {'position': p, 'num': nn}
                positions.append(pp)
            user = Staff.query.filter_by(id = session.get('id')).first()
            return render_template('/admin/dash/pages/positions.html', title="SalesPoint - Version 1.0-build 1", bodyClass="position", staff_active='active', config_active='active', config_expand='true', staff_expand='true', config_show='show', mng_staff_show='show', date=getDate(), role=session.get('role'), user=user, positions=positions, pos_active='active')
        if request.method == 'POST':
            name = request.form['name']
            newPos = Staff_Position(name, 1)
            db.session.add(newPos)
            db.session.commit()
            return jsonify({'message': 'OK', 'alertType': 'success', 'timer': 500, 'callback': 'goTo', 'param' : url_for('positions')})
    return redirect(url_for('logout')) 

@app.route('/pos/edit/<int:pos_id>', methods=['POST'])
def edit_pos(pos_id):
    print(pos_id)
    print(request.form)
    if session.get('role') == 'Administrator':
        if request.method == 'POST':
            pos = Staff_Position.query.filter_by(id = pos_id).first()
            print(pos)
            n = request.form['action'] != 'delete'
            if n is True:               
                pos.name = request.form['name']
                pos.is_active = 0           
                db.session.commit()
                return jsonify({'message': 'OK', 'alertType': 'success', 'timer': 500, 'callback': 'goTo', 'param' : url_for('positions')})
            else:
                staff = Staff.query.filter_by(position_id = pos_id).count()
                if staff > 0:
                    return jsonify({'status': 'error', 'message': 'This position has active staff and cannot be removed.', 'alertType': 'error'})
                else:
                    db.session.delete(pos)
                    db.session.commit() 
                    return jsonify({'message': 'OK', 'alertType': 'success', 'timer': 500, 'callback': 'goTo', 'param' : url_for('positions')})
        else:
            return redirect(url_for('positions'))
    else: 
        return redirect(url_for('logout'))

#=============================MENU ROUTES=========================================#

@app.route('/menu', methods=['POST', 'GET'])
def menu():
    if session.get('role') == 'Administrator':       
        cat = Menu_Category.query.all()
        catkeys =Menu_Category.__table__.columns.keys()
        taxes = Tax.query.all()
        i = Menu_Item.query.all()
        itemkeys = Menu_Item.__table__.columns.keys()
        s = []
        for a in i:
            t = Menu_Category.query.filter_by(id = a.item_category).first()
            p = getItemImage(a.id)
            bb = {'item': a, 'cat': t.name}
            if p:
                bb['img'] = p
            s.append(bb)
        user = Staff.query.filter_by(id = session.get('id')).first()
        return render_template('/admin/dash/pages/menu.html', title="SalesPoint - Version 1.0-build 1", bodyClass="menu", menu_mng_active='active', ops_post='active', ops_expand='true', mng_show='show', date=getDate(), role=session.get('role'), user=user, cat=cat, items=s, menutable='Menu Categories', itemtable='Menu Items', catkeys=catkeys, itemkeys=itemkeys, taxes=taxes)
    else:    
        return redirect(url_for('logout'))    

@app.route('/menu/edit_cat/<int:id>', methods=['POST'])
def edit_cat(id):
    if session.get('role') == 'Administrator':
        if request.method == 'POST':        
            cate = Menu_Category.query.filter_by(id = id).first()
            cate.name = request.form['cat_name']
            if 'active' in request.form:
               cate.is_active = True
            else:
                cate.is_active = False           
            db.session.commit()
            return jsonify({'message': 'OK', 'alertType': 'success', 'timer': 500, 'callback': 'loadElement', 'param' : 'cat'})
        else:
            return redirect(url_for('menu'))
    else: 
        return redirect(url_for('logout'))

@app.route('/menu/cat/add', methods=['POST'])
def addCat():
    if session.get('role') == "Administrator":
        if request.method == 'POST':
            catname = request.form['cat_name']
            is_active = False
            if 'active' in request.form:
                is_active = True
            newcat = Menu_Category(catname, is_active)
            db.session.add(newcat)
            db.session.commit()        
            return jsonify({'message': 'OK', 'alertType': 'success', 'timer': 500, 'callback': 'loadElement', 'param' : 'cat'})
        else:
            return redirect(url_for('menu'))
    else:
        return redirect(url_for('logout'))

@app.route('/edit_item/<int:id>', methods=['POST'])
def edit_item(id):
    if session.get('role') == 'Administrator':
        if request.method == 'POST':       
            item = Menu_Item.query.filter_by(id = id).first()
            item.item_name = request.form['item_name']
            item.unit_price= request.form['price']
            item.item_category = request.form['category']
            item.item_description = request.form['desc']            
            if 'offered' in request.form:
               item.is_offered = True
            else:
                item.is_offered = False
            if 'special' in request.form:
               item.is_special = True
            else:
                item.is_special = False
            if 'image' in request.files:           
                img  = request.files['image']
                if img:
                    filename = secure_filename(img.filename)
                    img.save(os.path.join(app.config['ABSOLUTE_PATH'], filename))
                    image = Item_Image.query.filter_by(item_id = id).first()
                    if image:
                        image.path = app.config['RELATIVE_PATH'] + img.filename
                        image.filename = filename
                    else:
                        newimg = Item_Image(img.filename, app.config['RELATIVE_PATH'] + img.filename, id)
                        db.session.add(newimg)
            if 'tax' in request.form:
                itax = ItemTax.query.filter_by(item = id).all()
                for t in itax:
                    db.session.delete(t)
                    db.session.commit()
                taxes = request.form.getlist('tax')
                for tax in taxes:
                    newitemtax = ItemTax(tax, id)
                    db.session.add(newitemtax)                                
            db.session.commit()
            return jsonify({'message': 'OK', 'alertType': 'success', 'timer': 500, 'callback': 'loadElement', 'param' : 'item'})
        else:
            return redirect(url_for('menu'))
    else: 
        return redirect(url_for('logout'))

@app.route('/add_item/', methods=['POST'])
def add_item():
    print(request.referrer)
    if session.get('role') == 'Administrator':
        if request.method == 'POST': 
            print(request.form)         
            item_name = request.form['item_name']
            unit_price= request.form['price']
            item_category = request.form['category']
            item_description = request.form['desc']
            is_offered = False           
            if 'offered' in request.form:
               is_offered = True
            is_special = False
            if 'special' in request.form:
               is_special = True
            item = Menu_Item(item_name, unit_price, item_category, item_description, is_offered, is_special)
            db.session.add(item)           
            db.session.commit()
            id = item.id
            if 'image' in request.files:           
                img  = request.files['image']
                if img:
                    filename = secure_filename(img.filename)
                    img.save(os.path.join(app.config['ABSOLUTE_PATH'], filename))
                    image = Item_Image.query.filter_by(filename = filename).first() is not None
                    if image:
                        image.item_id = id
                        # os.path.join(app.config['ABSOLUTE_PATH'], img.filename)
                    else:
                        newimg = Item_Image(img.filename, app.config['RELATIVE_PATH'] + img.filename, id)
                        db.session.add(newimg)
                        db.session.commit()           
            taxes = request.form.getlist('tax')
            for tax in taxes:
                newitemtax = ItemTax(tax, id)
                db.session.add(newitemtax)
            db.session.commit() 
            if request.referrer == request.host_url + 'admin':
               flash("New Menu Item Added", 'success') 
               return redirect(request.referrer)    
            return jsonify({'message': 'OK', 'alertType': 'success', 'timer': 500, 'callback': 'loadElement', 'param' : 'item'})
        else:
            return redirect(url_for('menu'))
    else: 
        return redirect(url_for('logout'))

@app.route('/edit_actions/<int:id>', methods=['POST'])
def actions(id):
    if session.get('role') == "Administrator":
        if request.method == 'POST':
            print(request.args)
        else:
            return redirect(url_for('menu'))
    else:
        return redirect(url_for('logout'))

#==================================Taxes====================================================
@app.route('/tax/', methods=['GET', 'POST'])
def tax():
    if session.get('role') == 'Administrator':
        if request.method == 'POST':
            rate = request.form['taxrate']
            newTax = Tax(request.form['taxtype'], rate)
            db.session.add(newTax)
            db.session.commit()
            return jsonify({'message': 'OK', 'alertType': 'success', 'timer': 500, 'callback': 'loadTable'})            
        else:
            taxes = Tax.query.all()
            return render_template('/admin/dash/pages/tax.html', title="SalesPoint - Version 1.0-build 1", bodyClass="tax", tax_active='active', ops_post='active', ops_expand='true', mng_expand='true', mng_show='show', menu_show='show', date=getDate(), role=session.get('role'), user=getUser(), tablename='Tax', itemtable='Menu Items', taxes=taxes)
    else:
        return redirect(url_for('logout'))


@app.route('/tax_edit/', methods=['POST'])
def taxedit():
    if session.get('role') == 'Administrator':
        if request.method == 'POST':
            l = request.form['items']           
            rows = multiRow(l)        
            for row in rows:
                tax = Tax.query.filter_by(id = row['taxid']).first()                   
                if tax:                        
                    tax.tax_type = row['taxtype']
                    tax.tax_rate = row['taxrate']
                    db.session.add(tax)
            db.session.commit()
            return jsonify({'message': 'OK', 'alertType': 'success', 'timer': 500, 'callback': 'reload'})
        return redirect(url_for('tax'))
    return redirect(url_for('logout'))

#===================================Discounts==========================================

@app.route('/discounts', methods=['GET', 'POST'])
def discounts():
    if session.get('role') == "Administrator":
        if request.method == 'POST':
            try:
                if 'active' in request.form:
                    active = True
                else:
                    active=False
                if 'neverexp' in request.form:
                    noexp = True
                else:
                    noexp = False
                if request.form['expdate'] != '':
                    exp = datetime.strptime(request.form['expdate'], '%m/%d/%Y').date()                    
                else:
                    now =  datetime.now().date()
                    exp = now + timedelta(days=30)           
                newdiscount = Discount(request.form['discountname'].upper(), request.form['discounttype'], request.form['discountvalue'], exp, active, noexp)
                db.session.add(newdiscount)
                db.session.commit()
                return jsonify({'message': 'OK', 'alertType': 'success', 'timer': 500, 'callback': 'reload'})
            except IntegrityError:
                db.session.rollback()
                return jsonify({'status': 'error', 'message': 'A discount with that name already exist.', 'alertType': 'error', 'timer': 2500})
            except Exception as e:
                db.session.rollback()
                error = str(e)
                return jsonify({'status': 'error', 'message': 'datetime error ' + error, 'alertType': 'error'})
        return render_template('/admin/dash/pages/discounts.html', title="SalesPoint - Version 1.0-build 1", bodyClass="discounts", dis_active='active', ops_post='active', ops_expand='true', mng_expand='true', mng_show='show', menu_show='show', date=getDate(), role=session.get('role'), user=getUser(), tablename='Discounts', itemtable='Menu Items', discounts=Discount.query.all(), discounttype=Discount_Type.query.all())
    return redirect(url_for('logout'))     

@app.route('/discount_edit/', methods=['POST'])
def disedit():
    if session.get('role') == 'Administrator':
        if request.method == 'POST': 
            l = request.form['items']           
            rows = multiRow(l) 
            print(rows)                    
            if request.form['action'] == 'delete':
                for row in rows:
                    ds = Discount.query.filter_by(id = row['discountid']).first()
                    db.session.delete(ds)
                    db.session.commit()
                return jsonify({'message': 'OK', 'alertType': 'success', 'timer': 500, 'callback': 'reload'})
            else:                 
                for row in rows:
                    try:
                        discount = Discount.query.filter_by(id = row['discountid']).first()                   
                        if discount:                        
                            discount.discount_name = row['discountname'].upper()
                            discount.type_id = row['discounttypeid']
                            discount.value = row['discountvalue']
                            n = row['expdate'] == ''
                            if n is False:
                                discount.expir_date = datetime.strptime(row['expdate'], '%m/%d/%Y').date()                        
                            if 'active' in row:
                                discount.is_active = True
                            else:
                                discount.is_active = False
                            if 'neverexp' in row:
                                discount.no_expiry = True
                            else:
                                discount.no_expiry = False
                        db.session.commit()
                    except IntegrityError:
                        db.session.rollback()
                        return jsonify({'status': 'error', 'message': 'A discount with that name already exist.', 'alertType': 'error', 'timer': 2500})
                    except Exception as e:
                        db.session.rollback()
                        error = str(e)
                        return jsonify({'status': 'error', 'message': 'datetime error ' + error, 'alertType': 'error'})              
                    return jsonify({'message': 'OK', 'alertType': 'success', 'timer': 500, 'callback': 'reload'})
        return redirect(url_for('discounts'))
    return redirect(url_for('logout'))

#==========================================Tables===================================================
@app.route('/setTable/', methods=['GET', 'POST'])
def setTable():
    if session.get('role') == 'Administrator':
        Tables = Table.query.all()
        if request.method == 'POST':
            print(request.form)
            notupdate = []
            l = request.form['items']            
            if request.form['action'] == 'edit':               
                tables = multiRow(l)                                
                for table in tables:
                    uptable = Table.query.filter_by(id = table['tableid']).first()
                    if uptable:                        
                        if int(table['num']) != int(uptable.table_no):
                            notupdate.append(table['num'])
                        else:
                            uptable.table_no = table['num']
                        uptable.capacity = table['cap']
                    db.session.add(uptable)
                db.session.commit()
                if len(notupdate) > 0:
                    str1 = ','.join(str(e) for e in notupdate)
                    return jsonify({'message': 'Table(s) ' + str1 + ' already exist. Delete the current table(s) first.', 'alertType': 'warning', 'timer': 5000, 'callback': 'reup'})
                else:
                    return jsonify({'message': 'OK', 'alertType': 'success', 'timer': 500, 'callback': 'reup'})
            if request.form['action'] == 'delete':
                tables = ast.literal_eval(l)               
                for table in tables:
                    if Table.query.filter_by(id=table).first() is not None:
                        if Table.query.filter_by(id=table).first().available != False:
                            db.session.delete(Table.query.filter_by(id=table).first())
                        else:
                            notupdate.append(table['num'])
                    else:
                        notupdate.append(table['num'])
                db.session.commit()
                if len(notupdate) > 0:
                    str1 = ','.join(str(e) for e in notupdate)
                    return jsonify({'message': 'Table(s) with id(s)' + str1 + ' Do not exist or are in use. Create table(s) first or wait until table(s) are available.', 'alertType': 'warning', 'timer': 5000, 'callback': 'reup'})
                else:
                    return jsonify({'message': 'OK', 'alertType': 'success', 'timer': 500, 'callback': 'reup'})            
        else:
            keys = Table.__table__.columns.keys()
            return render_template('/admin/dash/pages/setTable.html', title="SalesPoint - Version 1.0-build 1", bodyClass="tax", table_active='active', ops_post='active', ops_expand='true', mng_expand='true', mng_show='show', menu_show='show', mng_active='active', date=getDate(), role=session.get('role'), user=getUser(), tablename='Tables', itemtable='Menu Items', tables=Tables, keys=keys)
    else:
        return redirect(url_for('logout'))

@app.route('/table-multi-add/', methods=['POST'])
def tablemultiAdd():
    if session.get('role') == 'Administrator':
        if request.method == 'POST':
            num = int(request.form['num'])           
            count = len(Table.query.all()) +1         
            stopper = num + count
            try:                   
                for n in range(count, stopper):
                    newtable = Table(n)                   
                    db.session.add(newtable)
                db.session.commit()
                return jsonify({'message': 'OK', 'alertType': 'success', 'timer': 500, 'callback': 'reup'})
            except Exception as e:               
                return jsonify({'message': 'Unable to create tables', 'alertType': 'warning', 'timer': 500})
        return redirect(url_for('setTable'))
    return redirect(url_for('logout'))

@app.route('/table_active/<int:tableid>', methods=['POST'])
def setActive(tableid):
    if session.get('role') == 'Administrator':
        if request.method == 'POST':
            update = Table.query.filter_by(id=tableid).first()           
            if request.form['action'] == 'archive':
                update.available = False
            else:
               update.available = True
            db.session.commit()
            return jsonify({'message': 'OK', 'alertType': 'success', 'timer': 500, 'callback': 'reup'})
        return redirect(url_for('setTable'))
    return redirect(url_for('logout'))


# ======================REPORTS========================
@app.route('/reports',   methods=['GET', 'POST'])
def reports():
    if 'id' in session:
        if session.get('role') == 'Administrator':
            if request.method == 'POST':
                min = datetime
                max = datetime
                if 'fromdate' in request.form:
                    min = datetime.strptime(request.form['fromdate'], "%m/%d/%Y %I:%M %p").date()
                if 'todate' in request.form:
                    max = datetime.strptime(request.form['todate'], "%m/%d/%Y %I:%M %p").date()
                    orders = Order.query.filter(Order.date_created.between(min, max)).all()
                    numdays = max - min
                    iterateData(orders)
                    report = Report.query.filter_by(id = request.form['report']).first()                    
                    return jsonify({'data': render_template(report.path, data=iterateData(orders), orders=orders, info=getBusInfo(), currenttime=datetime.now(), fromdate=min, todate=max, numdays=numdays,  report=report)})
                else:
                    return jsonify({'message': 'Query not found', 'alertType': 'success', 'timer': 500}) 
            else:
                return render_template('/admin/dash/pages/reports.html', title="SalesPoint - Version 1.0-build 1", bodyClass="reports",  report_active='active',  date=getDate(), role=session.get('role'), user=getUser(), reports=Report.query.all() )
    return redirect(url_for('logout'))

@app.route('/return_orders/<int:id>', methods=['POST'])
def getorders(id):
    order = Order.query.filter_by(id = id).first()
    return jsonify({'data': render_template('/reports/orderticket.html', order=order, term=getTerminal())})


if (__name__) == '__main__':
    db.create_all()
    app.run()
