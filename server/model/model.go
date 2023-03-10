package model

type DBHandler interface {
	AddUser(user User) (*User, error)
	GetEmailBySessionId(sessionId string) (string, error)
	GetUserByEamil(email string) *User

	GetUserCourse() []*UserCourseRes
	GetUserCourseById(id int) *UserCourse
	GetUserCoursesByEmail(email string) []*UserCourse
	AddUserCourse(data UserCourse) *UserCourse
	DeleteUserCourseById(id int) error
	Close()
}

func NewDBHandler(dbConn string) DBHandler {
	//handler = newMemoryHandler()
	//return newSqliteHandler(dbConn)
	return newPQHandler(dbConn)
}
