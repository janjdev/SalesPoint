from app import app, db, Staff
from flask import Flask, session
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
    
    
    