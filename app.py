from operator import add
import sys, os, io, collections, random, string, decimal, csv, tempfile, ast
from datetime import datetime
from sys import path
from flask import Flask, request, redirect, render_template, session, escape, url_for, abort, flash, jsonify, json
from flask_sqlalchemy import SQLAlchemy, Pagination
from numpy.lib.function_base import select
from sqlalchemy import event, DDL, extract, func
from sqlalchemy.event import listen
from jinja2 import TemplateNotFound
from sqlalchemy.orm import backref
from sqlalchemy.sql.elements import Null
from sqlalchemy.sql.schema import Column, ForeignKey
from hashutil import make_pw_hash, check_pw_hash
from helpers import *
from mimetypes import MimeTypes
from werkzeug.utils import secure_filename
from collections import defaultdict


app = Flask(__name__)
app.config.from_pyfile(os.path.join(".", "config.py"), silent=False)
db = SQLAlchemy(app)
D = decimal.Decimal

class Customer(db.Model):
    __tablename__ = "customer"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=True)
    customer_orders = db.relationship('Order', backref='customer')
    
    def __init__(self, name=""):
        self.name = name

class Staff(db.Model):
    __tablename__ = "staff"
    id = db.Column(db.Integer, primary_key=True)
    first_name = db.Column(db.String(255), nullable = False)
    last_name = db.Column(db.String(255), nullable = False)
    staff_id = db.Column(db.NCHAR(6), nullable=False)
    id_updated = db.Column(db.Boolean)
    position_id = db.Column(db.Integer, db.ForeignKey('position.id'))
    role_id = db.Column(db.Integer, db.ForeignKey('role.id'))
    is_active = db.Column(db.Boolean)
    created_orders = db.relationship("Order", foreign_keys='Order.created_by_id')
    changed_orders = db.relationship("Order", foreign_keys='Order.last_changed_by_id')    

    def __init__(self, first_name, last_name, pos, role, is_active=True, id_updated=False):
        self.first_name = first_name
        self.last_name = last_name
        self.staff_id = make_pw_hash(''.join([random.choice(string.digits) for x in range(6)]))
        self.position_id = pos
        self.role_id = role
        self.is_active = is_active
        self.id_updated = id_updated
        

class Staff_Position(db.Model):
    __tablename__ = 'position'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column('type', db.String(50), nullable=False, unique=True)
    is_active = db.Column(db.Boolean, nullable=False)
    staff = db.relationship('Staff', backref='position')     

    def __init__(self, name, is_active=True):
        self.name = name
        self.is_active = is_active

class Staff_Role(db.Model):
    __tablename__ = 'role'
    id = db.Column(db.Integer, primary_key=True)
    role_type = db.Column('type', db.String(50), nullable = False)
    staff = db.relationship('Staff', backref='role')     

    def __init__(self, role_type):
        self.role_type = role_type



class Order(db.Model):
    __tablename__ = "order"
    id = db.Column(db.Integer, primary_key=True)
    type_id = db.Column(db.Integer, db.ForeignKey('order_type.id'), nullable=False)
    status_id = db.Column(db.Integer, db.ForeignKey('order_status.id'), nullable=False)
    date_created = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    date_last_changed = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    notes = db.Column(db.Text, nullable=True, default="")
    created_by_id = db.Column(db.Integer, db.ForeignKey('staff.id', ondelete='CASCADE'), nullable=False)
    last_changed_by_id = db.Column(db.Integer, db.ForeignKey('staff.id', ondelete='CASCADE'), nullable=True)
    chk_num = db.Column(db.Integer, nullable=True)
    customer_id = db.Column(db.Integer, db.ForeignKey('customer.id'), nullable=False)
    items = db.relationship('Order_Items', backref='items')
    applied_discounts = db.relationship('Order_Discount', backref="discounts")           

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
    order = db.relationship('Order', backref='order.id', lazy=True)
    menu_item_id = db.Column(db.Integer, db.ForeignKey('menu_item.id', ondelete='CASCADE'), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)

    def __init__(self, orID, itID, qty):
        self.order_id = orID 
        self.menu_item_id = itID
        self.quantity = qty


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

    def __init__(self, order, discount):
        self.order_id = order
        self.discount_id = discount

class Discount(db.Model):
    __tablename__ = "discount"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable = False, unique=True)
    type_id = db.Column(db.Integer, db.ForeignKey('discount_type.id', ondelete='CASCADE'), nullable=False)
    value = db.Column(db.Numeric(2), nullable=False)
    expir_date = db.Column(db.DateTime, nullable=True)
    is_active = db.Column(db.Boolean, nullable=False)
    no_expiry = db.Column(db.Boolean, nullable =True)
    order_discounts = db.relationship('Order_Discount', backref='order_discount', lazy=True)

    def __init__(self, name, dtype, value,  is_active=True, no_expiry=True):
        self.discount_name = name
        self.discount_type = dtype
        self.value = value
        self.is_active = is_active
        self.no_expiry = no_expiry                    

class Discount_Type(db.Model):
    __tablename__ = "discount_type"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(20), nullable=False, unique=True)
    type_of_discount = db.relationship('Discount', backref='discount', lazy=True) 

    def __init__(self, name):
        self.name = name


class Sale(db.Model):
    __tablename__ = "sale"
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('order.id', ondelete='CASCADE'), nullable=True)
    final_tax = db.Column(db.Numeric(2), nullable=False)
    final_price = db.Column(db.Numeric(2), nullable=False)
    final_date = db.Column(db.DateTime, nullable=False)

    def __init__(self, id, price, tax, date):
        self.order_id = id
        self.final_tax = tax
        self.final_price = price
        self.final_date = date
 
class Tax(db.Model):
    __tablename__ = "tax"
    id = db.Column(db.Integer, primary_key=True)
    tax_type = db.Column(db.String(20), nullable = False, unique=True)
    tax_rate = db.Column(db.Numeric(2), nullable=False)

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
    unit_price = db.Column(db.Numeric(12, 2), nullable=False) 
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


class Menu_Category(db.Model):
    __tablename__ = 'menu_category'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column('category_name', db.String(50), nullable=False, unique=True)
    is_active = db.Column(db.Boolean, nullable=False)
    items = db.relationship('Menu_Item', backref='menu_item', lazy=True)     

    def __init__(self, name, is_active=True):
        self.name = name
        self.is_active = is_active        
   
# class Item_Category(db.Model):
#     __tablename__ = 'item_category'
#     id = db.Column(db.Integer, primary_key=True)
#     item_id =  db.Column(db.Integer, ForeignKey('menu_item.id', ondelete='CASCADE'), nullable=False)
#     category_id = db.Column(db.Integer, ForeignKey('menu_category.id', ondelete='CASCADE'), nullable=False)



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
    table = db.Column(db.Integer, ForeignKey("table.id"), nullable=False)
    order = db.Column(db.Integer, ForeignKey("order.id"), nullable=False)

    def __init__(self, table, order):
        self.table = table
        self.order = order

class Printer(db.Model):
    __tablename__ = "printer"      
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable = False)
    printer =  db.Column(db.String(255), unique=True, nullable = False)
    type_id = db.Column(db.Integer, db.ForeignKey('printer_type.id', ondelete='CASCADE'), nullable=False)

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
    

event.listen(Customer.__table__, 'after_create', DDL(""" INSERT INTO customer (id, name) VALUES (1, 'Guest')"""))
event.listen(Staff_Role.__table__, 'after_create', DDL(""" INSERT INTO role (id, type) VALUES (1, 'administrator'),  (2, 'user') """))
event.listen(Staff_Position.__table__, 'after_create', DDL(""" INSERT INTO position (id, type, is_active) VALUES (1, 'manager', True),  (2, 'server', True) """))
event.listen(Order_Status.__table__, 'after_create', DDL(""" INSERT INTO order_status (id, status) VALUES (1, 'open'),  (2, 'settled'), (3, 'canceled'), (4, 'refund'), (5, 'pending') """))
event.listen(Order_Type.__table__, 'after_create', DDL(""" INSERT INTO order_type (id, order_type) VALUES (1, 'dine-in'),  (2, 'carry-out') """))
event.listen(Discount_Type.__table__, 'after_create', DDL(""" INSERT INTO discount_type (id, name) VALUES (1, 'Amount'),  (2, 'Percentage') """))
event.listen(Printer_Type.__table__, 'after_create', DDL(""" INSERT INTO printer_type (id, name) VALUES (1, 'report'),  (2, 'receipt'), (3, 'kitchen') """))

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
    return render_template('screens/auth.html', title="Authorizations", bodyClass='dashboard')

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
        try:     
            importToSQL(filepath)
            return jsonify({'status': 'success', 'alertType': 'success', 'timer': 500,})
        except:
            return jsonify({'status': 'Could not import all items. Check that the form is in the correct format. See "help" for more information', 'alertType': 'error', 'timer': 2500,})

        


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
            print(request.form)
            print(customer) 
            if 'delete' in request.form:
                corders = Order.query.filter(Order.customer_id == user_id and Order.status_id == 1).all()
                if len(corders) > 0:
                    return jsonify({'status': 'error', 'message': 'Cannot delete customers with open orders. Settle orders before trying again' , 'alertType': 'warning', 'timer': 2500, 'callback': 'newCust'})
                else:
                    db.session.delete(customer)             
            else:         
                cname = request.form['cname']
                print(cname)
                customer.name = cname
            db.session.commit()
            return jsonify({'status': 'success', 'alertType': 'success', 'timer': 500, 'callback': 'newCust'})
        return redirect(url_for('carry_out'))
    return redirect(url_for('logout'))

#======================================Orders========================================================

@app.route('/dine-in', methods=['GET', 'POST'])
def dine_in():
    return render_template('',  title="SalesPoint - Version 1.0-build 1.0.1", bodyClass='tables', date=getDate())


@app.route('/carry-out', methods=['GET', 'POST'])
def carry_out():
    if request.method == 'POST':
        ID = request.form['staffID']
        staff = Staff.query.filter_by(staff_id = ID).first()
        if staff:
            if staff.role_id < 3:              
                session['id'] = staff.id                         
                return jsonify({'status': 'success', 'alertType': 'success', 'timer': 500, 'callback': 'goTo', 'param': url_for('carry_out')})
            else:
                return jsonify({'status': 'error', 'message': 'No Permission', 'alertType': 'error'})
        else:
            return jsonify({'status': 'error', 'message': 'ID Not Found', 'alertType': 'error'})
    if 'id' in session:
        staff = Staff.query.filter_by(id = session.get('id')).first()
        customers = Customer.query.filter(Customer.id > 1).all()                 
        return render_template('tasks/pages/new_order.html', title="SalesPoint - Version 1.0-build 1.0.1", bodyClass='shared-tasks', images=getImages(), date=getDate(), user=staff, ordertype="Carry-Out", orderstatus="New Ticket", cat=getActiveCat(), items=getOfferedItems(), orderstatusID=1, ordertypeID=2, customers=customers, taxes=Tax.query.all())
    return redirect(url_for('logout'))


@app.route('/order/', methods=['POST'])
def order():
    if 'id' in session:
        if request.method == 'POST':
            i = request.form['items']
            neworder = Order(request.form['ordertype'], session.get('id'), request.form['chknum'], request.form['notes'], request.form['customer'],  request.form['orderstatus'] )
            db.session.add(neworder)
            db.session.commit()
            orderID = neworder.id           
            items = multiRow(i)           
            for item in items:
                if 'itemname' in item.keys():
                    itemname = item['itemname'].replace("%20", " ").title()                    
                    if Menu_Item.query.filter_by(item_name = itemname).first() is not None:                        
                        db.session.rollback()
                        db.session.delete(neworder)
                        db.session.commit()
                        return jsonify({'status': 'success', 'message':  itemname + ' already exist. Please use the current item from the list.', 'alertType': 'warning', 'timer': 6000}) 
                    else:                        
                        newmenuitem = Menu_Item(item['itemname'].replace("%20", " "), item['price'], 0)
                        db.session.add(newmenuitem)
                        db.session.commit()
                        neworderitem = Order_Items(orderID, newmenuitem.id, item['qty'])
                        db.session.add(neworderitem)
                else:    
                    newitem = Order_Items(orderID, item['item'], item['qty'])
                    db.session.add(newitem)                   
            db.session.commit()           
            if  request.form['orderstatus'] == '1':
                session['currentorder'] = orderID
                return jsonify({'status': 'success', 'alertType': 'success', 'timer': 500, 'callback': 'goTo', 'param': '/settle/'+ str(orderID)})
            else:
               return jsonify({'status': 'success', 'alertType': 'success', 'timer': 500, 'callback': 'clearOrder'})         
    return redirect(url_for('logout'))

@app.route('/orders', methods=['GET', 'POST'])
def orders():
    if request.method == 'POST':
        ID = request.form['staffID']
        staff = Staff.query.filter_by(staff_id = ID).first()
        if staff: 
            if staff.role_id < 3:                       
                session['id'] = staff.id               
                return jsonify({'status': 'success', 'alertType': 'success', 'timer': 500, 'callback': 'goTo', 'param': '/orders'})
            else:
                return jsonify({'status': 'error', 'message': 'No Permission', 'alertType': 'error'})
        else:
            return jsonify({'status': 'error', 'message': 'ID Not Found', 'alertType': 'error'})    
    if 'id' in session:
        if Staff.query.filter_by(id = session.get('id')).first().role_id == 1:
            allorders = Order.query.all()
        else:
            allorders = Order.query.filter_by(created_by_id = session.get('id')).all()
        return render_template('tasks/pages/orders.html', title="SalesPoint - Version 1.0-build 1.0.1", bodyClass='shared-tasks', date=getDate(), user=getUser(), orders=allorders)
    return redirect(url_for('logout'))

@app.route('/settle/<int:orderid>', methods=['POST', 'GET'])
def settle(orderid):
    if 'id' in session:
        if request.method == 'POST':
            return
        return render_template('tasks/pages/settle.html', title="SalesPoint - Version 1.0-build 1.0.1", bodyClass='shared-tasks', date=getDate(), user=getUser(), order=Order.query.filter_by(id = orderid).first())
    return redirect(url_for('logout'))


@app.route('/kitchen', methods=['GET', 'POST'])
def kitchen():
    return render_template('screens/auth.html', title="Authorizations", bodyClass='dashboard', date=getDate())

#=================================================Configurations====================================================

@app.route('/admin', methods=['GET', 'POST'])
def admin():
    if request.method == 'POST':
        ID = request.form['staffID']
        staff = Staff.query.filter_by(staff_id = ID).first()
        if staff:                   
            if staff.role_id == 1:
                session['role'] = "Administrator"
                session['id'] = staff.id                
                return jsonify({'status': 'success', 'alertType': 'success', 'timer': 1000, 'callback': 'goTo', 'param': url_for('admin')})
            else:
                return jsonify({'status': 'error', 'message': 'Permission restricted', 'alertType': 'error'})        
        return jsonify({'status': 'error', 'message': 'ID Not Found', 'alertType': 'error'})
    if request.method == 'GET':
        if session.get('role') == 'Administrator':
            user = Staff.query.filter_by(id = session.get('id')).first()
            return render_template('admin/dash/pages/dash.html', title="SalesPoint - Version 1.0-build 1", bodyClass='dashboard', time=datetime.now().strftime("%I:%M"), daynight=datetime.now().strftime("%p"), user=user, date=getDate(), role=session.get('role'))
        return redirect(url_for('home'))


@app.route('/config', methods=['GET'])
def config():
    if session.get('role') == 'Administrator':
        user = Staff.query.filter_by(id = session.get('id')).first()
        printertypes = Printer_Type.query.all()
        return render_template('admin/dash/pages/config.html', title="SalesPoint - Version 1.0-build 1", bodyClass='config', fonts=getFonts(), config_active='active', config_show='show', config_expand='true', admin_active='active', date=getDate(), role=session.get('role'), user=user, printertype = printertypes, info = getBusInfo(), term = getTerminal())
    return redirect(url_for('home'))


@app.route('/bus', methods=['POST'])
def get_bus():
    if session.get('role') == "Administrator":
        if (request.method=='POST'):
            setBusInfo(request.form['name'], request.form['phone'], request.form['add'], request.form['city'], request.form['st'], request.form['zip'])
            return jsonify({'message': 'OK', 'alertType': 'success', 'timer': 500, 'callback': 'loadElement', 'param' : 'info'})
        else:
            return redirect(url_for('config'))
    else:
        return redirect(url_for('home'))


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
        return redirect(url_for('home'))  
 

@app.route('/activity')
def order_activity():
    return render_template('', title="SalesPoint - Version 1.0-build 1")


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
    if request.method == 'POST':
        fname = request.form['fname']
        lname = request.form['lname']
        pos = request.form['position']
        role = request.form['role']
        newHire = Staff(fname, lname, pos, role)
        db.session.add(newHire)
        db.session.commit()
    return jsonify({'message': 'OK', 'alertType': 'success', 'timer': 500, 'callback': 'goTo', 'param' : url_for('staff')})

@app.route('/staff/edit/<int:user_id>', methods=['POST'])
def edit_staff(user_id):
    if session.get('role') == 'Administrator':
        if request.method == 'POST':        
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
            return jsonify({'message': 'OK', 'alertType': 'success', 'timer': 500, 'callback': 'goTo', 'param' : url_for('staff')})
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
    if session.get('role') == 'Administrator':
        if request.method == 'POST':        
            pos = Staff_Position.query.filter_by(id = pos_id).first()
            pos.name = request.form['name']
            pos.is_active = 0           
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
            print(request.form)          
            item = Menu_Item.query.filter_by(id = id).first()
            item.item_name = request.form['item_name']
            item.unit_price= request.form['price']
            # D(request.form['price'])* 100
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
    if session.get('role') == 'Administrator':
        if request.method == 'POST': 
            print(request.form)         
            item_name = request.form['item_name']
            unit_price= request.form['price']
            # D(request.form['price']) * 100
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
            # D(request.form['taxrate']) * 10000
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
            print(rows)        
            for row in rows:
                tax = Tax.query.filter_by(id = row['taxid']).first()                   
                if tax:                        
                    tax.tax_type = row['taxtype']
                    tax.tax_rate = row['taxrate']
                    # D(row['taxrate']) * 10000
                    db.session.add(tax)
            db.session.commit()
            return jsonify({'message': 'OK', 'alertType': 'success', 'timer': 500, 'callback': 'reload'})
        return redirect(url_for('tax'))
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
            print(stopper) 
            try:                   
                for n in range(count, stopper):
                    newtable = Table(n)                   
                    db.session.add(newtable)
                db.session.commit()
                return jsonify({'message': 'OK', 'alertType': 'success', 'timer': 500, 'callback': 'reup'})
            except Exception as e:
                print(e)               
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





if (__name__) == '__main__':
    # print(sys.version)
    db.create_all()
    #db.drop_all()
    app.run()
