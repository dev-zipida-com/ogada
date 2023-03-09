package app

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strconv"
	"strings"

	"server/model"

	"github.com/gorilla/mux"
	"github.com/gorilla/sessions"
	"github.com/unrolled/render"
	"github.com/urfave/negroni"
)

var store = sessions.NewCookieStore([]byte(os.Getenv("SESSION_KEY")))
var rd *render.Render = render.New()

type AppHandler struct {
	http.Handler
	db model.DBHandler
}

func (a *AppHandler) Close() {
	a.db.Close()
}

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
	sessionId := getSesssionID(r)

	var user model.UserCourse
	err := json.NewDecoder(r.Body).Decode(&user)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	defer r.Body.Close()

	userCourse := a.db.AddUserCourse(sessionId, user)

	rd.JSON(w, http.StatusCreated, userCourse)
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
	sessionId := getSesssionID(r)
	if err != nil {
		http.Error(w, "Invalid Token", http.StatusBadRequest)
		return
	}
	// 해당 id를 갖는 userCourse를 조회합니다.
	userCourse := a.db.GetUserCourseById(id)
	if userCourse == nil {
		http.Error(w, "Not found", http.StatusNotFound)
		return
	}
	// 조회된 userCourse의 sessionId와 요청한 sessionId가 일치하는지 확인합니다.
	if userCourse.SessionId != sessionId {
		http.Error(w, "Forbidden", http.StatusForbidden)
		return
	}
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
	if strings.Contains(r.URL.Path, "/signin") ||
		strings.Contains(r.URL.Path, "/auth") {
		next(w, r)
		return
	}

	// if user already signed in
	sessionID := getSesssionID(r)
	if sessionID != "" {

		next(w, r)
		return
	}
	// if not user sign in
	// redirect singin.html
	http.Error(w, "Unauthorized", http.StatusUnauthorized)

	// http.Redirect(w, r, "/auth/google/login", http.StatusTemporaryRedirect)
}

func MakeHandler(dbConn string) *AppHandler {
	r := mux.NewRouter()
	n := negroni.New(
		negroni.NewRecovery(),
		negroni.NewLogger(),
		negroni.HandlerFunc(CheckSignin))
	n.UseHandler(r)

	a := &AppHandler{
		Handler: n,
		db:      model.NewDBHandler("postgresql://postgres:456123@localhost:5432/dataplanner?sslmode=disable"),
	}

	r.HandleFunc("/auth/google/login", googleLoginHandler)
	r.HandleFunc("/auth/google/callback", googleAuthCallback)
	r.HandleFunc("/course/save", a.addUserCourseHandler).Methods("POST")
	r.HandleFunc("/course/{id:[0-9]+}", a.getUserCourseByIdHandler).Methods("GET")
	r.HandleFunc("/course/{id:[0-9]+}", a.deleteUserCourseByIdHandler).Methods("DELETE")
	r.HandleFunc("/course", a.getUserCourseListHandler).Methods("GET")
	r.HandleFunc("/", a.indexHandler)

	return a
}
