class Report(db.Model):
#     __tablename__ = 'report'
#     id = db.Column(db.Integer, primary_key=True)
#     name = db.Column(db.String(255), unique=True, nullable = False)
#     path = db.Column(db.Text, unique=True, nullable = False)
#     type_id =  db.Column(db.Integer, db.ForeignKey('report_type.id', ondelete='CASCADE'), nullable=False)
#     _type = db.relationship('Report_Type', backref='type')

#     def __init__(self, name, path, type):
#         self.name = name
#         self.path = path
#         self.type_id = type