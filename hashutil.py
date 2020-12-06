import hashlib
import random
import string

def make_salt():
    return ''.join([random.choice(string.ascii_letters) for x in range(5)])

def make_pw_hash(password, salt):    
    if not salt:
        salt = make_salt()
    hash = hashlib.sha512(str.encode(password + salt)).hexdigest()
    return '{0},{1}'.format(hash, salt)
