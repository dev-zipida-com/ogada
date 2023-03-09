package model

import "time"

type UserCourse struct {
	ID           int       `json:"id"`
	SessionId    string    `json:"sessionid"`
	Email        string    `json:"email"`
	Course       string    `json:"course"`
	QuestionList string    `json:"questionList"`
	CreatedAt    time.Time `json:"created_at`
}

type UserCourseRes struct {
	ID     int    `json:"id"`
	Email  string `json:"email"`
	Course string `json:"course"`
}
