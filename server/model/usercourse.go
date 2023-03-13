package model

import (
	"database/sql"
	"encoding/json"
	"log"
	"time"
)

type UserCourse struct {
	ID int `json:"id"`
	// Email        string    `json:"email"`
	DateCourse CourseInfo `json:"dateCourse"`
	// QuestionList string    `json:"questionList"`
	CreatedAt time.Time `json:"created_at`
}

type CourseInfo struct {
	Course      string        `json:"course"`
	Information []Information `json:"information"`
}

type Information struct {
	Position struct {
		Lat string `json:"lat"`
		Lng string `json:"lng"`
	} `json:"position"`
	Content     string `json:"content"`
	AddressName string `json:"address_name"`
	Phone       string `json:"phone"`
}

func (s *pqHandler) GetUserCourse() []*UserCourse {
	userCourses := []*UserCourse{}
	rows, err := s.db.Query("SELECT id, dateCourse, createdAt FROM usercourses ORDER BY createdAt DESC limit 5")
	if err != nil {
		panic(err)
	}
	defer rows.Close()
	for rows.Next() {
		var userCourse UserCourse
		var dateCourseJSON string
		rows.Scan(&userCourse.ID, &dateCourseJSON, &userCourse.CreatedAt)

		var dateCourse UserCourse
		err = json.Unmarshal([]byte(dateCourseJSON), &dateCourse)
		if err != nil {
			log.Println("Failed to Unmarshal ", err)
		}
		userCourse.DateCourse = dateCourse.DateCourse

		userCourses = append(userCourses, &userCourse)
	}
	return userCourses
}

func (s *pqHandler) GetUserCourseById(id int) *UserCourse {
	row := s.db.QueryRow(`SELECT id, dateCourse, createdAt FROM usercourses WHERE id=$1`, id)

	var userCourse UserCourse
	var dateCourseJSON string

	err := row.Scan(&userCourse.ID, &dateCourseJSON, &userCourse.CreatedAt)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil
		}
		panic(err)
	}

	var dateCourse UserCourse
	err = json.Unmarshal([]byte(dateCourseJSON), &dateCourse)
	if err != nil {
		log.Println("Failed to Unmarshal ", err)
	}
	userCourse.DateCourse = dateCourse.DateCourse

	return &userCourse
}

// func (s *pqHandler) GetUserCoursesByEmail(email string) []*UserCourse {
// 	rows, err := s.db.Query(`SELECT id, email, course, questionList, createdAt FROM usercourses WHERE email=$1`, email)
// 	if err != nil {
// 		panic(err)
// 	}
// 	defer rows.Close()

// 	var userCourses []*UserCourse
// 	for rows.Next() {
// 		var userCourse UserCourse
// 		var questionList string
// 		if err := rows.Scan(&userCourse.ID, &userCourse.Email, &userCourse.Course, &questionList, &userCourse.CreatedAt); err != nil {
// 			panic(err)
// 		}
// 		userCourses = append(userCourses, &userCourse)
// 	}

// 	return userCourses
// }

func (s *pqHandler) AddUserCourse(dateCourse string) *UserCourse {
	stmt, err := s.db.Prepare("INSERT INTO usercourses (dateCourse, createdAt) VALUES ($1, NOW()) RETURNING id")
	if err != nil {
		panic(err)
	}
	defer stmt.Close()

	var id int
	err = stmt.QueryRow(dateCourse).Scan(&id)
	if err != nil {
		panic(err)
	}
	// Convert the JSON data to a slice of CourseInfo structs
	var courseInfoSlice UserCourse
	err = json.Unmarshal([]byte(dateCourse), &courseInfoSlice)
	if err != nil {
		log.Println("Failed to unmarshal JSON data:", err)
	}

	var userCourse UserCourse
	userCourse.ID = id
	userCourse.DateCourse = courseInfoSlice.DateCourse
	userCourse.CreatedAt = time.Now()

	return &userCourse
}

func (s *pqHandler) DeleteUserCourseById(id int) error {
	_, err := s.db.Exec("DELETE FROM usercourses WHERE id=$1", id)
	return err
}
