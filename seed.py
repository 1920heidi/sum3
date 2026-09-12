from app import app, db
from models import Note, User


with app.app_context():
    db.drop_all()
    db.create_all()

    users = [
        User(username="alice"),
        User(username="bob"),
    ]
    users[0].password = "password123"
    users[1].password = "password123"

    db.session.add_all(users)
    db.session.commit()

    notes = [
        Note(title="Morning plan", content="Review tasks and priorities.", user_id=users[0].id),
        Note(title="Workout", content="30 minutes of cardio and stretching.", user_id=users[0].id),
        Note(title="Ideas", content="Prototype the dashboard interactions for Friday.", user_id=users[1].id),
    ]

    db.session.add_all(notes)
    db.session.commit()

    print("Database seeded with users and notes.")
