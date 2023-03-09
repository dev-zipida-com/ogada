package model

type DBHandler interface {
	GetUserCourse(sessionId string) []*UserCourseRes
	GetUserCourseById(id int) *UserCourse
	GetUserCoursesBySessionId(sessionId string) []*UserCourse
	AddUserCourse(sessionId string, data UserCourse) *UserCourse
	DeleteUserCourseById(id int) error
	Close()
}

func NewDBHandler(dbConn string) DBHandler {
	//handler = newMemoryHandler()
	//return newSqliteHandler(dbConn)
	return newPQHandler(dbConn)
}
