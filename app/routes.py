
from flask import Flask, render_template, request, redirect, url_for, jsonify
from flask_sqlalchemy import SQLAlchemy
import os
from datetime import datetime
from flask import send_from_directory

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///shopping.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

class Item(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    quantity = db.Column(db.Integer, default=1)
    bought = db.Column(db.Boolean, default=False)
    priority = db.Column(db.Integer, default=2)  # 1=High, 2=Medium, 3=Low
    position = db.Column(db.Integer, nullable=False, default=0)  # For drag-and-drop ordering

class FrequentItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    quantity = db.Column(db.Integer, default=1)
    last_added = db.Column(db.DateTime, default=datetime.utcnow)
    add_count = db.Column(db.Integer, default=1)

# Initialize database and migrations in a single app context
with app.app_context():
    # Create all tables
    db.create_all()
    
    # Migration 1: Ensure no null positions exist in Item
    Item.query.filter(Item.position == None).update({'position': 0})
    
    # Migration 2: Create default frequent items if they don't exist
    default_items = ['Cola', 'Eggs', 'Milk', 'Chips']
    for item in default_items:
        if not FrequentItem.query.filter_by(name=item).first():
            db.session.add(FrequentItem(name=item))
    
    db.session.commit()

@app.route('/static/<path:filename>')
def static_files(filename):
    return send_from_directory('static', filename)

@app.teardown_appcontext
def shutdown_session(exception=None):
    db.session.remove()

@app.route('/')
def index():
    # Get all items and ensure positions are not None
    items = Item.query.all()
    for item in items:
        if item.position is None:
            item.position = 0
    
    # Sort: unbought items first (by position), then bought items (by position)
    items.sort(key=lambda x: (x.bought, x.position))
    
    return render_template('index.html', items=items)

@app.route('/add', methods=['POST'])
def add():
    name = request.form.get('name')
    quantity = request.form.get('quantity', 1)
    new_item = Item(name=name, quantity=quantity)
    db.session.add(new_item)
    db.session.commit()
    return redirect(url_for('index'))

@app.route('/toggle/<int:item_id>')
def toggle(item_id):
    item = Item.query.get(item_id)
    if item:
        item.bought = not item.bought
        
        # If marking as bought, move to bottom of its group
        if item.bought:
            # Get max position among bought items
            max_bought_pos = db.session.query(db.func.max(Item.position))\
                                      .filter(Item.bought == True)\
                                      .scalar() or 0
            item.position = max_bought_pos + 1
        else:
            # If marking as unbought, move to top
            min_unbought_pos = db.session.query(db.func.min(Item.position))\
                                        .filter(Item.bought == False)\
                                        .scalar() or 0
            item.position = min_unbought_pos - 1
            
        db.session.commit()
        return jsonify({'status': 'success', 'new_position': item.position})
    return jsonify({'status': 'error'}), 404

@app.route('/delete/<int:item_id>')
def delete(item_id):
    Item.query.filter_by(id=item_id).delete()
    db.session.commit()
    return redirect(url_for('index'))

@app.route('/update_position', methods=['POST'])
def update_position():
    data = request.get_json()
    for item in data['items']:
        db_item = Item.query.get(item['id'])
        db_item.position = item['position']
    db.session.commit()
    return jsonify({'status': 'success'})

@app.route('/update_priority/<int:item_id>', methods=['POST'])
def update_priority(item_id):
    data = request.get_json()
    item = Item.query.get(item_id)
    item.priority = data['priority']
    db.session.commit()
    return jsonify({'status': 'success'})

@app.route('/mark_all_bought', methods=['POST'])
def mark_all_bought():
    try:
        # Update all items that aren't already bought
        Item.query.filter_by(bought=False).update({'bought': True})
        db.session.commit()
        return jsonify({'status': 'success', 'count': Item.query.filter_by(bought=True).count()})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/health')
def health_check():
    try:
        # Simple DB check
        db.session.execute('SELECT 1')
        return jsonify({'status': 'healthy'}), 200
    except Exception as e:
        return jsonify({'status': 'unhealthy', 'error': str(e)}), 500

@app.route('/add_frequent/<int:item_id>')
def add_frequent(item_id):
    frequent_item = FrequentItem.query.get(item_id)
    if frequent_item:
        # Update usage stats
        frequent_item.last_added = datetime.utcnow()
        frequent_item.add_count += 1
        # Add to main list
        new_item = Item(
            name=frequent_item.name,
            quantity=frequent_item.quantity,
            position=Item.query.count()  # Add at end
        )
        db.session.add(new_item)
        db.session.commit()
        return jsonify({'status': 'success'})
    return jsonify({'status': 'error'}), 404

@app.route('/frequent_items')
def get_frequent_items():
    items = FrequentItem.query.order_by(FrequentItem.add_count.desc()).limit(5).all()
    return jsonify([{'id': i.id, 'name': i.name} for i in items])

