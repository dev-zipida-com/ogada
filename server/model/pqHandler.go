package model

import (
	"database/sql"
	"encoding/json"
	"time"

	_ "github.com/lib/pq"
)

type pqHandler struct {
	db *sql.DB
}

func (s *pqHandler) GetUserCourse(sessionId string) []*UserCourseRes {
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
	row := s.db.QueryRow(`SELECT id, sessionId, email, course, questionList, createdAt FROM usercourses WHERE id=$1`, id)

	var userCourse UserCourse
	err := row.Scan(&userCourse.ID, &userCourse.SessionId, &userCourse.Email, &userCourse.Course, &userCourse.QuestionList, &userCourse.CreatedAt)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil
		}
		panic(err)
	}

	return &userCourse
}

func (s *pqHandler) GetUserCoursesBySessionId(sessionId string) []*UserCourse {
	rows, err := s.db.Query(`SELECT id, sessionId, email, course, questionList, createdAt FROM usercourses WHERE sessionId=$1`, sessionId)
	if err != nil {
		panic(err)
	}
	defer rows.Close()

	var userCourses []*UserCourse
	for rows.Next() {
		var userCourse UserCourse
		var questionList string
		if err := rows.Scan(&userCourse.ID, &userCourse.SessionId, &userCourse.Email, &userCourse.Course, &questionList, &userCourse.CreatedAt); err != nil {
			panic(err)
		}

		if err := json.Unmarshal([]byte(questionList), &userCourse.QuestionList); err != nil {
			panic(err)
		}

		userCourses = append(userCourses, &userCourse)
	}

	return userCourses
}

func (s *pqHandler) AddUserCourse(sessionId string, data UserCourse) *UserCourse {
	stmt, err := s.db.Prepare("INSERT INTO usercourses (sessionId, email, course, questionList, createdAt) VALUES ($1, $2, $3, $4, NOW()) RETURNING id")
	if err != nil {
		panic(err)
	}
	defer stmt.Close()

	var id int
	err = stmt.QueryRow(data.SessionId, data.Email, data.Course, data.QuestionList).Scan(&id)
	if err != nil {
		panic(err)
	}

	var userCourse UserCourse
	userCourse.ID = id
	userCourse.SessionId = data.SessionId
	userCourse.Email = data.Email
	userCourse.Course = data.Course
	userCourse.QuestionList = data.QuestionList
	userCourse.CreatedAt = time.Now()

	return &userCourse
}

func (s *pqHandler) Close() {
	s.db.Close()
}

func (s *pqHandler) DeleteUserCourseById(id int) error {
	_, err := s.db.Exec("DELETE FROM usercourses WHERE id=$1", id)
	return err
}

func newPQHandler(dbConn string) DBHandler {
	database, err := sql.Open("postgres", dbConn)
	if err != nil {
		panic(err)
	}
	statement, err := database.Prepare(
		`CREATE TABLE IF NOT EXISTS usercourses (
			id        SERIAL PRIMARY KEY,
			sessionId VARCHAR(256),
			email	  VARCHAR(256),
			course    TEXT,
			questionList TEXT,
			createdAt TIMESTAMP
		);`)
	if err != nil {
		panic(err)
	}
	_, err = statement.Exec()
	if err != nil {
		panic(err)
	}
	// session ID 이 인덱스로 지정되어있지 않은경우 인덱스로 지정 (=검색시간 매우 빠름)
	statement, err = database.Prepare(
		`CREATE INDEX IF NOT EXISTS sessionIdIndexOnUserCourses ON usercourses (
			sessionId ASC
		);`)
	if err != nil {
		panic(err)
	}
	_, err = statement.Exec()
	if err != nil {
		panic(err)
	}
	return &pqHandler{db: database}
}
