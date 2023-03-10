package model

import (
	"database/sql"

	_ "github.com/lib/pq"
)

type pqHandler struct {
	db *sql.DB
}

func (s *pqHandler) Close() {
	s.db.Close()
}

func newPQHandler(dbConn string) DBHandler {
	database, err := sql.Open("postgres", dbConn)
	if err != nil {
		panic(err)
	}
	statement, err := database.Prepare(
		`CREATE TABLE IF NOT EXISTS usercourses (
			id        SERIAL PRIMARY KEY,
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
		`CREATE INDEX IF NOT EXISTS emailIndexOnUserCourses ON usercourses (
			email ASC
		);`)
	if err != nil {
		panic(err)
	}
	_, err = statement.Exec()
	if err != nil {
		panic(err)
	}

	statement, err = database.Prepare(
		`CREATE TABLE IF NOT EXISTS users (
			id        	SERIAL PRIMARY KEY,
			sessionId	VARCHAR(256),
			email    	TEXT
		);`)
	if err != nil {
		panic(err)
	}
	_, err = statement.Exec()
	if err != nil {
		panic(err)
	}
	statement, err = database.Prepare(
		`CREATE INDEX IF NOT EXISTS sessionIdIndexOnUser ON users (
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
