package model

import (
	"database/sql"
	"time"
)

type UserCourse struct {
	ID           int       `json:"id"`
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

func (s *pqHandler) GetUserCourse() []*UserCourseRes {
	userCourses := []*UserCourseRes{}
	rows, err := s.db.Query("SELECT id, email, course FROM usercourses")
	if err != nil {
		panic(err)
	}
	defer rows.Close()
	for rows.Next() {
		var userCourse UserCourseRes
		rows.Scan(&userCourse.ID, &userCourse.Email, &userCourse.Course)
		userCourses = append(userCourses, &userCourse)
	}
	return userCourses
}

func (s *pqHandler) GetUserCourseById(id int) *UserCourse {
	row := s.db.QueryRow(`SELECT id, email, course, questionList, createdAt FROM usercourses WHERE id=$1`, id)

	var userCourse UserCourse
	err := row.Scan(&userCourse.ID, &userCourse.Email, &userCourse.Course, &userCourse.QuestionList, &userCourse.CreatedAt)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil
		}
		panic(err)
	}

	return &userCourse
}

func (s *pqHandler) GetUserCoursesByEmail(email string) []*UserCourse {
	rows, err := s.db.Query(`SELECT id, email, course, questionList, createdAt FROM usercourses WHERE email=$1`, email)
	if err != nil {
		panic(err)
	}
	defer rows.Close()

	var userCourses []*UserCourse
	for rows.Next() {
		var userCourse UserCourse
		var questionList string
		if err := rows.Scan(&userCourse.ID, &userCourse.Email, &userCourse.Course, &questionList, &userCourse.CreatedAt); err != nil {
			panic(err)
		}
		userCourses = append(userCourses, &userCourse)
	}

	return userCourses
}

func (s *pqHandler) AddUserCourse(data UserCourse) *UserCourse {
	stmt, err := s.db.Prepare("INSERT INTO usercourses (email, course, questionList, createdAt) VALUES ($1, $2, $3, NOW()) RETURNING id")
	if err != nil {
		panic(err)
	}
	defer stmt.Close()

	var id int
	err = stmt.QueryRow(data.Email, data.Course, data.QuestionList).Scan(&id)
	if err != nil {
		panic(err)
	}

	var userCourse UserCourse
	userCourse.ID = id
	userCourse.Email = data.Email
	userCourse.Course = data.Course
	userCourse.QuestionList = data.QuestionList
	userCourse.CreatedAt = time.Now()

	return &userCourse
}

func (s *pqHandler) DeleteUserCourseById(id int) error {
	_, err := s.db.Exec("DELETE FROM usercourses WHERE id=$1", id)
	return err
}
