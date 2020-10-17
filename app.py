import sys, os, io, collections, calendar, random, string
from datetime import datetime
from flask import Flask, request, redirect, render_template, session, escape, url_for, abort, flash, jsonify, json
from flask_sqlalchemy import SQLAlchemy, Pagination
from sqlalchemy import event, DDL, extract
from sqlalchemy.event import listen
from jinja2 import TemplateNotFound
from hashutil import make_pw_hash, check_pw_hash
import helpers


app = Flask(__name__)
app.config.from_pyfile(os.path.join(".", "config.py"), silent=False)
db = SQLAlchemy(app)

class Customer():
    __tablename__ = "customer"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=True)
    
    def __init__(self, name=""):
        self.name = name

class Staff(db.Model):
    __tablename__ = "staff"
    id = db.Column(db.Integer, primary_key=True)
    first_name = db.Column(db.String(255), nullable = False)
    last_name = db.Column(db.String(255), nullable = False)
    staff_id = db.Column(db.NCHAR(6), nullable=False)
    staff_postion_id = db.Column(db.Integer, db.ForeignKey('positions.id'))
    staff_role_id = db.Column(db.Integer, db.ForeignKey('roles.id'))

    def __init__(first_name, last_name):
        self.first_name = first_name
        self.last_name = last_name
        self.staff_id = ''.join([random.choice(string.digits) for x in range(6)])

class Staff_Position(db.Model):
    __tablename__ = 'positions'
    id = db.Column(db.Integer, primary_key=True)
    position_type = db.Column(db.String(50), nullable=False, unique=True)
    

    def __init__(position_type):
        self.position_type = position_type

class Staff_Role(db.Model):
    __tablename__ = 'roles'
    id = db.Column(db.Integer, primary_key=True)
    role_type = db.Column(db.String(50), nullable = False)

    def __init__(role_type):
        self.role_type = role_type

class Order(db.Model):
    __tablename__ = "order"
    id = db.Column(db.Integer, primary_key=True)
    order_type_id = db.Column(db.Integer, db.ForeignKey('order_type.id'), nullable=False)
    order_status_id = db.Column(db.Integer, db.ForeignKey('order_status.id'), default=1, nullable=False)
    date_created = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    last_changed = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    notes = db.Column(db.Text, nullable=True, default="")
    subtotal = db.Column(db.Numeric(2), nullable=False)
    tax = db.Column(db.Numeric(2), nullable=False)
    charged_tips = db.Column(db.Numeric(2), nullable=True)
    order_total = db.Column(db.Numeric(2), nullable=False)
    created_by_id = db.Column(db.Integer, db.ForeignKey('staff.id'), nullable=False)
    last_changed_by_id = db.Column(db.Integer, db.ForeignKey('staff.id'), nullable=True)
    order_item = db.relationship('Ordered_Item', backref='ordered_item', lazy=True)

    def __init__(order_type_id, order_status, created_by_id, subtotal,  tax, order_total, notes="", customer_id=""):
        self.order_type_id = order_type_id
        self.order_status = order_status
        self.created_by_id = created_by_id
        self.subtotal = subtotal
        self.tax = tax
        self.order_total = order_total
        self.notes = notes
        self.customer_id = customer_id


class Order_Status(db.Model):
    __tablename__ = "order_status"    
    id = db.Column(db.Integer, primary_key=True)
    order_status = db.Column(db.String(20), nullable = False, unique=True)

    def __init__(order_status):
        self.order_status = order_status

class Discount(db.Model):
    __tablename__ = "discount"
    id = db.Column(db.Integer, primary_key=True)
    discount_name = db.Column(db.String(50), nullable = False, unique=True)
    discount_type_id = db.Column(db.Integer, db.ForeignKey('discount_type.id'), nullable=False)
    value = db.Column(db.Numeric(2), nullable=False)
    expir_date = db.Column(db.DateTime, nullable=False)
    is_active = db.Column(db.Boolean, nullable = False)
    no_expiry = db.Column(db.Boolean, nullable = True)

    def __init__(name, dtype, value, active, expdate, expir):
        self.discount_name = name
        self.discount_type = dtype
        self.value = value
        self.expir_date = expdate
        self.is_active = active
        self.no_expiry = expir  

class Discount_Type(db.Model):
    __tablename__ = "discount_type"
    id = db.Column(db.Integer, primary_key=True)
    type_name = db.Column(db.String(20), nullable=False, unique=True)

    def __init__(name):
        self.type_name = name

class Order_Type(db.Model):
    __tablename__ = "order_type"
    id = db.Column(db.Integer, primary_key=True)
    order_type = db.Column(db.String(50), nullable = False, unique=True)

    def __init__(order_type):
        self.order_type = order_type

class Ordered_Item(db.Model):
    __tablename__ = "ordered_item"
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('order.id'), nullable=False)
    menu_item_id = db.Column(db.Integer, db.ForeignKey('menu_item.id'), nullable=False)
    quantity = db.Column(db.Integer)

class Sale(db.Model):
    __tablename__ = "sale"
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('order.id'), nullable=True)
    final_tax = db.Column(db.Numeric(2), nullable=False)
    final_price = db.Column(db.Numeric(2), nullable=False)
    final_date = db.Column(db.DateTime, nullable=False)

    def __init__(id, price, tax, date):
        self.order_id = id
        self.final_tax = tax
        self.final_price = price
        self.final_date = date
 
class Tax(db.Model):
    __tablename__ = "tax"
    id = db.Column(db.Integer, primary_key=True)
    tax_type = db.Column(db.String(20), nullable = False, unique=True)
    tax_rate = db.Column(db.Numeric(2), nullable=False)

    def __init__(type, rate):
        self.tax_type = type
        self.tax_rate = rate
        
class Menu_Item(db.Model):
    __tablename__ = "menu_item"
    id = db.Column(db.Integer, primary_key=True)
    item_name = db.Column(db.String(50), unique=True, nullable = False)
    unit_price = db.Column(db.Numeric(2), nullable=False)
    item_category = db.Column(db.Integer, db.ForeignKey('menu_category.id'), nullable=False)
    item_description = db.Column(db.Text, nullable=True, default="")
    is_offered = db.Column(db.Boolean, nullable = True)
    is_special = db.Column(db.Boolean, nullable = True)
    has_substitute = db.Column(db.Boolean, nullable = True)
    Substitute = db.relationship('Substitute', backref='substitute', lazy=True)

    def __init__(name, price, cat, descr, offered, speci, sub):
        self.item_name = name
        self.unit_price = price
        self.item_category = cat
        self.item_description = descr
        self.is_offered = offered
        self.is_special = speci
        self.has_substitute = sub

class Menu_Categorey(db.Model):
    __tablename__ = "menu_category"
    id = db.Column(db.Integer, primary_key=True)
    category_name = db.Column(db.String(50), unique=True, nullable = False)

    def __init__(name):
        self.category_name = name

class Substitute(db.Model):
    __tablename__ = "substitute"
    id = db.Column(db.Integer, primary_key=True)
    menu_item_id = db.Column(db.Integer, db.ForeignKey('menu_item.id'), nullable=False)
    

class Menu_Special(db.Model):
    __tablename__ = "menu_special"
    id = db.Column(db.Integer, primary_key=True)
    menu_item_id = db.Column(db.Integer, db.ForeignKey('menu_item.id'), nullable=False)
    has_entree = db.Column(db.Boolean, nullable = False)
    has_appetizer = db.Column(db.Boolean, nullable = False)
    has_soup = db.Column(db.Boolean, nullable = False)

class Table(db.Model):
    __tablename__ = "table"
    id = db.Column(db.Integer, primary_key=True)
    table_no = db.Column(db.Integer, unique=True)
    capacity = db.Column(db.Integer)
    description = db.Column(db.Text, nullable=True, default="")
    

event.listen(Staff_Role.__table__, 'after_create', DDL(""" INSERT INTO roles (id, role_type)  VALUE (1, 'Admin', 'admin'),  (2, 'User', 'user') """))



#======================ROUTES==============================================
@app.route('/')
def home():
    try:
        types = Order_Type.query.all()        
        return render_template('screens/window_main.html', title="SalesPoint - Version 1.0-build 10", types=types, bodyClass='main_window')
    except TemplateNotFound:
        abort(404)

@app.route('/admin')
def admin():
    return render_template('admin/dash/pages/dash.html', title="SalesPoint - Version 1.0-build 1", bodyClass='dashboard')

@app.route('/config')
def config():
    return render_template('admin/dash/pages/config.html', title="SalesPoint - Version 1.0-build 1")

@app.route('/activity')
def order_activity():
    return render_template('admin/dash/pages/dash.html', title="SalesPoint - Version 1.0-build 1")





@app.route('/logout')
def logout():
    # session.pop('user', None)
    # session.pop('id', None)
    # session.pop('authenticated', None)
    session.clear()
    return redirect(url_for('login'))




if (__name__) == '__main__':
    db.create_all()
    app.run()
