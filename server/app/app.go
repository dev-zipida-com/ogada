package app

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"strconv"

	"server/model"

	"github.com/gorilla/mux"
	"github.com/gorilla/sessions"
	"github.com/rs/cors"
	"github.com/unrolled/render"
	"github.com/urfave/negroni"
)

// SESSION_KEY 를 바탕으로 쿠키 데이터를 암호화하는 저장소를 만든다.
var store = sessions.NewCookieStore([]byte(os.Getenv("SESSION_KEY")))
var rd *render.Render = render.New()

type AppHandler struct {
	http.Handler
	db model.DBHandler
}

func (a *AppHandler) Close() {
	a.db.Close()
}

// 세션쿠키에 저장된 유저의 세션 ID 를 가져오는 함수
var getSesssionID = func(r *http.Request) string {
	session, err := store.Get(r, "session")
	if err != nil {
		return ""
	}

	// Set some session values.
	val := session.Values["id"]
	if val == nil {
		return ""
	}

	return val.(string)
}

func (a *AppHandler) indexHandler(w http.ResponseWriter, r *http.Request) {
	fmt.Fprintf(w, "Hello World!")
	// http.Redirect(w, r, "/", http.StatusTemporaryRedirect)
}

func (a *AppHandler) getUserCourseListHandler(w http.ResponseWriter, r *http.Request) {
	// sessionId := getSesssionID(r)
	list := a.db.GetUserCourse()
	rd.JSON(w, http.StatusOK, list)
}

func (a *AppHandler) getUserCourseByIdHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, _ := strconv.Atoi(vars["id"])

	userCourse := a.db.GetUserCourseById(id)
	if userCourse == nil {
		http.Error(w, "UserCourse not found", http.StatusNotFound)
		return
	}

	rd.JSON(w, http.StatusOK, userCourse)
}

func (a *AppHandler) addUserCourseHandler(w http.ResponseWriter, r *http.Request) {
	// sessionId := getSesssionID(r)

	// var user model.UserCourse
	// Read the request body
	body, err := ioutil.ReadAll(r.Body)
	if err != nil {
		http.Error(w, "Failed to read request body", http.StatusInternalServerError)
		return
	}

	// Convert the request body to a CourseInfo struct
	var courseInfo model.UserCourse
	err = json.Unmarshal(body, &courseInfo)
	if err != nil {
		http.Error(w, "Invalid JSON format", http.StatusBadRequest)
		return
	}

	// Convert the CourseInfo struct to JSON string
	jsonString, err := json.Marshal(courseInfo)
	if err != nil {
		http.Error(w, "Failed to marshal CourseInfo struct", http.StatusInternalServerError)
		return
	}
	log.Println(string(jsonString))
	userCourseRes := a.db.AddUserCourse(string(jsonString))
	log.Println(userCourseRes)

	rd.JSON(w, http.StatusCreated, userCourseRes)
}

func (a *AppHandler) deleteUserCourseByIdHandler(w http.ResponseWriter, r *http.Request) {
	// URL 파라미터에서 id를 추출합니다.
	vars := mux.Vars(r)
	id, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "Invalid ID", http.StatusBadRequest)
		return
	}
	// 세션 쿠키에서 sessionId를 추출합니다.
	// sessionId := getSesssionID(r)
	// if err != nil {
	// 	http.Error(w, "Invalid Email", http.StatusBadRequest)
	// 	return
	// }
	// email, _ := a.db.GetEmailBySessionId(sessionId)
	// 해당 id를 갖는 userCourse를 조회합니다.
	userCourse := a.db.GetUserCourseById(id)
	if userCourse == nil {
		http.Error(w, "Not found", http.StatusNotFound)
		return
	}
	// 조회된 userCourse의 sessionId와 요청한 sessionId가 일치하는지 확인합니다.
	// if userCourse.Email != email {
	// 	http.Error(w, "Forbidden", http.StatusForbidden)
	// 	return
	// }
	// userCourse를 삭제합니다.
	if err := a.db.DeleteUserCourseById(id); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	// 성공적으로 삭제되었음을 응답합니다.
	w.WriteHeader(http.StatusNoContent)
}

// 로그인 체크하는 함수
func CheckSignin(w http.ResponseWriter, r *http.Request, next http.HandlerFunc) {
	// if request URL is /signin.html, then next()
	// if strings.Contains(r.URL.Path, "/signin") ||
	// 	strings.Contains(r.URL.Path, "/auth") {
	// 	next(w, r)
	// 	return
	// }

	// // if user already signed in
	// sessionID := getSesssionID(r)
	// if sessionID != "" {

	// 	next(w, r)
	// 	return
	// }

	// if not user sign in
	// redirect login uri
	// http.Error(w, "Unauthorized", http.StatusUnauthorized)
	next(w, r)
	return
}

func MakeHandler(dbConn string) *AppHandler {
	r := mux.NewRouter()

	// CORS 미들웨어 생성
	c := cors.New(cors.Options{
		AllowedOrigins: []string{"*", "http://localhost:3000"},
		AllowedMethods: []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders: []string{"Content-Type", "Authorization"},
		MaxAge:         86400,
	})

	n := negroni.New(
		negroni.NewRecovery(),
		negroni.NewLogger(),
		negroni.HandlerFunc(CheckSignin),
		c,
	)

	n.UseHandler(r)

	a := &AppHandler{
		Handler: n,
		db:      model.NewDBHandler(dbConn),
	}

	r.HandleFunc("/auth/google/login", googleLoginHandler)
	r.HandleFunc("/auth/google/callback", a.googleAuthCallback)
	r.HandleFunc("/course/save", a.addUserCourseHandler).Methods("POST")
	r.HandleFunc("/course/{id:[0-9]+}", a.getUserCourseByIdHandler).Methods("GET")
	r.HandleFunc("/course/{id:[0-9]+}", a.deleteUserCourseByIdHandler).Methods("DELETE")
	r.HandleFunc("/course", a.getUserCourseListHandler).Methods("GET")
	r.HandleFunc("/crawling", a.getCrawlingStoreListHandler).Methods("POST")
	r.HandleFunc("/", a.indexHandler)

	return a
}
