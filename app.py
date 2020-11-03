from os import name
import sys, os, io, collections, calendar, random, string
from datetime import datetime
from flask import Flask, request, redirect, render_template, session, escape, url_for, abort, flash, jsonify, json
from flask_sqlalchemy import SQLAlchemy, Pagination
from sqlalchemy import event, DDL, extract, func
from sqlalchemy.event import listen
from jinja2 import TemplateNotFound
from hashutil import make_pw_hash, check_pw_hash
from helpers import *


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
    position_id = db.Column(db.Integer, db.ForeignKey('position.id'))
    role_id = db.Column(db.Integer, db.ForeignKey('role.id'))

    def __init__(self, first_name, last_name, pos, role):
        self.first_name = first_name
        self.last_name = last_name
        self.staff_id = make_pw_hash(''.join([random.choice(string.digits) for x in range(6)]))
        self.position_id = pos
        self.role_id = role
        

class Staff_Position(db.Model):
    __tablename__ = 'position'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column('type', db.String(50), nullable=False, unique=True)    

    def __init__(self, name):
        self.name = name

class Staff_Role(db.Model):
    __tablename__ = 'role'
    id = db.Column(db.Integer, primary_key=True)
    role_type = db.Column('type', db.String(50), nullable = False)

    def __init__(self, role_type):
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

    def __init__(self, order_type_id, order_status, created_by_id, subtotal,  tax, order_total, notes="", customer_id=""):
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

    def __init__(self, order_status):
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

    def __init__(self, name, dtype, value, active, expdate, expir):
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

    def __init__(self, name):
        self.type_name = name

class Order_Type(db.Model):
    __tablename__ = "order_type"
    id = db.Column(db.Integer, primary_key=True)
    order_type = db.Column(db.String(50), nullable = False, unique=True)

    def __init__(self, order_type):
        self.order_type = order_type

class Ordered_Item(db.Model):
    __tablename__ = "ordered_item"
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('order.id'), nullable=False)
    menu_item_id = db.Column(db.Integer, db.ForeignKey('menu_item.id'), nullable=False)
    quantity = db.Column(db.Integer)

    def __init__(self, orID, itID, qty):
        self.order_id = orID 
        self.menu_item_id = itID
        self.quatity = qty       


class Sale(db.Model):
    __tablename__ = "sale"
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('order.id'), nullable=True)
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

    def __init__(self, name, price, cat, descr):
        self.item_name = name
        self.unit_price = price
        self.item_category = cat
        self.item_description = descr
        self.is_offered = True
        self.is_special = False
        self.has_substitute = False

class Menu_Categorey(db.Model):
    __tablename__ = "menu_category"
    id = db.Column(db.Integer, primary_key=True)
    category_name = db.Column(db.String(50), unique=True, nullable = False)
    is_active = db.Column(db.Boolean, nullable=False)

    def __init__(self, name):
        self.category_name = name
        self.is_active = True

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

    def __init__(self, no, cap, desc):
        self.table_no = no
        self.capacity = cap 
        self.description = desc

class Printer(db.Model):
    __tablename__ = "printer"      
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable = False)
    printer =  db.Column(db.String(255), unique=True, nullable = False)
    type_id = db.Column(db.Integer, db.ForeignKey('printer_type.id'), nullable=False)
    Printer_Type = db.relationship('Printer_Type', backref='Printer_Type', lazy=True)

class Printer_Type(db.Model):
    __tablename__ = "printer_type"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable = False)
    

event.listen(Staff_Role.__table__, 'after_create', DDL(""" INSERT INTO role (id, type) VALUES (1, 'administrator'),  (2, 'user') """))
event.listen(Staff_Position.__table__, 'after_create', DDL(""" INSERT INTO position (id, type) VALUES (1, 'manager'),  (2, 'server') """))
event.listen(Printer_Type.__table__, 'after_create', DDL(""" INSERT INTO printer_type (id, name) VALUES (1, 'report'),  (2, 'receipt'), (3, 'kitchen') """))



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

@app.route('/dine-in', methods=['GET', 'POST'])
def dine_in():
    return render_template('',  title="SalesPoint - Version 1.0-build 1.0.1", bodyClass='tables', date=getDate())

@app.route('/carry-out', methods=['GET', 'POST'])
def carry_out():
    if request.method == 'POST':
        ID = request.form['staffID']
        staff = Staff.query.filter_by(staff_id = ID).first()
        if staff:              
            session['id'] = staff.id                
            return jsonify({'status': 'success', 'alertType': 'success', 'timer': 500, 'callback': 'goTo', 'param': url_for('carry_out')})
        else:
            return jsonify({'status': 'error', 'message': 'ID Not Found', 'alertType': 'error'})
    if 'id' in session:
        staff = Staff.query.filter_by(id = session.get('id')).first()
        return render_template('tasks/pages/new_order.html', title="SalesPoint - Version 1.0-build 1.0.1", bodyClass='shared-tasks', images=getImages(), date=getDate(), user=staff)
    return redirect(url_for('home'))

@app.route('/orders', methods=['GET', 'POST'])
def orders():
    if request.method == 'POST':
        ID = request.form['staffID']
        staff = Staff.query.filter_by(staff_id = ID).first()
        if staff:              
            session['id'] = staff.id                
            return jsonify({'status': 'success', 'alertType': 'success', 'timer': 500, 'callback': 'goTo', 'param': '/orders'})
        else:
            return jsonify({'status': 'error', 'message': 'ID Not Found', 'alertType': 'error'})
    if id in session:
        return render_template('screens/auth.html', title="Authorizations", bodyClass='dashboard', date=getDate())

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

@app.route('/kitchen', methods=['GET', 'POST'])
def kitchen():
    return render_template('screens/auth.html', title="Authorizations", bodyClass='dashboard', date=getDate())

@app.route('/shut-down', methods=['GET', 'POST'])
def shut_down():
    return render_template('screens/auth.html', title="Authorizations", bodyClass='dashboard')

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

@app.route('/logout')
def logout():
    # session.pop('user', None)
    # session.pop('id', None)
    # session.pop('authenticated', None)
    session.clear()
    return redirect(url_for('home'))


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
            newPos = Staff_Position(name)
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
            db.session.commit()
            return jsonify({'message': 'OK', 'alertType': 'success', 'timer': 500, 'callback': 'goTo', 'param' : url_for('positions')})
        else:
            return redirect(url_for('positions')) 
    return redirect(url_for('logout'))

@app.route('/menu', methods=['POST', 'GET'])
def menu():
    if session.get('role') == 'Administrator':
        if request.method == 'GET':
            cat = Menu_Categorey.query.all()
            i = Menu_Item.query.all()
            s = []
            for a in i:
                t = Menu_Categorey.query.filter_by(id = a.item_category).first()
                bb = {'item': a, 'cat': t.name}
                s.append(bb)
            user = Staff.query.filter_by(id = session.get('id')).first()
            return render_template('/admin/dash/pages/menu.html', title="SalesPoint - Version 1.0-build 1", bodyClass="menu", menu_mng_active='active', ops_post='active', ops_expand='true', mng_show='show', date=getDate(), role=session.get('role'), user=user, cat=cat, items=s, menutable='Menu Categories', itemtable='Menu Items')
    return redirect(url_for('logout'))    

@app.route('/edit_cat/<int:id>', methods=['POST'])
def edit_cat(id):
    return

@app.route('/add_cat/', methods=['POST'])
def add_cat():
    return

@app.route('/edit_item/<int:id>', methods=['POST'])
def edit_item(id):
    return

@app.route('/add_item/', methods=['POST'])
def add_item():
    return


    




if (__name__) == '__main__':
    db.create_all()
    #db.drop_all()
    app.run()
