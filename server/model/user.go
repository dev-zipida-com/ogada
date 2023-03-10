package model

import (
	"database/sql"
	"log"
)

type User struct {
	ID        int    `json:"id"`
	SessionId string `json:"sessionid"`
	Email     string `json:"email"`
}

func (s *pqHandler) AddUser(user User) (*User, error) {
	// Check if the user already exists
	existingUser := s.GetUserByEamil(user.Email)
	log.Println(existingUser)
	if existingUser != nil {
		_, err := s.db.Exec("UPDATE users SET sessionId=$1 WHERE id=$2", user.SessionId, existingUser.ID)
		if err != nil {
			return nil, err
		}
		return existingUser, nil
	}
	// User does not exist, create a new one
	row := s.db.QueryRow(`INSERT INTO users (sessionId, email) VALUES ($1, $2) RETURNING id`, user.SessionId, user.Email)
	var id int
	err := row.Scan(&id)
	if err != nil {
		return nil, err
	}
	newUser := &User{
		ID:        id,
		SessionId: user.SessionId,
		Email:     user.Email,
	}
	return newUser, nil
}

func (s *pqHandler) GetUser(sessionId string) *User {
	row, err := s.db.Query(`SELECT id, sessionId, email FROM users WHERE sessionId=$1`, sessionId)
	if err != nil {
		panic(err)
	}
	defer row.Close()

	var user User
	if row.Next() {
		err = row.Scan(&user.ID, &user.SessionId, &user.Email)
		if err != nil {
			panic(err)
		}
	} else {
		return nil
	}

	return &user
}

func (s *pqHandler) GetEmailBySessionID(sessionID string) (string, error) {
	var email string
	err := s.db.QueryRow("SELECT email FROM users WHERE sessionId = $1", sessionID).Scan(&email)
	if err != nil {
		return "", err
	}
	return email, nil
}

func (s *pqHandler) GetUserByEamil(email string) *User {
	var user User
	err := s.db.QueryRow("SELECT * FROM users WHERE email=$1", email).Scan(&user.ID, &user.SessionId, &user.Email)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil
		}
		panic(err)
	}
	return &user
}
