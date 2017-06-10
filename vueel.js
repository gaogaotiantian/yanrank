var server_url = "http://localhost:8000";
$.cloudinary.config({ cloud_name: 'yanrank', api_key: '585812587869167'});
const store = new Vuex.Store( {
    state : {
        isLogin: false,
        username: '',
        token: '',
        email: '',
        level: 0,
        levelStat: [{'benefit': 0, 'post_gap': 0, 'post_limit': 0}, {'benefit': 1, 'post_gap': 24, 'post_limit': 3}, {'benefit': 2, 'post_gap': 6, 'post_limit': 5}, {'benefit': 3, 'post_gap': 3, 'post_limit': 8}, {'benefit': 4, 'post_gap': 1, 'post_limit': 12},{'benefit': 4, 'post_gap': 1, 'post_limit': 12}, {'benefit': 5, 'post_gap': 0.5, 'post_limit': 17}],
        loadedLocal: false,
    },
    mutations: {
        SetLogin (state, data) {
            state.isLogin = data;
        },
        SetUser(state, data) {
            state.username = data['username'];
            state.token    = data['token'];
            if (typeof(Storage) !== "undefined") {
                localStorage.username = state.username;
                localStorage.token = state.token;
            }
        },
        SetCheckUserName(state, data) {
            state.checkusername = data['username'];
        },
        SetLevel(state, data) {
            state.level = data;
        },
        SetLoadedLocal(state, data){
            state.loadedLocal = data;
        },
        ClearUser(state) {
            state.isLogin = false;
            state.username = "";
            state.token = "";
            if (typeof(Storage) !== "undefined") {
                localStorage.removeItem("username")
                localStorage.removeItem("token")
            }
        }
    },
    actions: {
        CheckTokenValid({commit, state}) {
            if (state.loadedLocal == false) {
                if (typeof(Storage) !== "undefined") {
                    if (localStorage.username !== undefined) {
                        store.commit('SetUser',{"username":localStorage.username,"token":localStorage.token});
                        store.commit('SetLogin', true)
                    }
                }
                store.commit('SetLoadedLocal', true);
            }
            $.ajax( {
                url: server_url+"/uservalid",
                method: "POST",
                dataType: "json",
                contentType: 'application/json;charset=UTF-8',
                data: JSON.stringify({"username": state.username, "token":state.token}),
                success: function(msg) {
                    if (msg['valid'] == true) {
                        commit('SetLogin', true);
                    } else {
                        if (state.isLogin) {
                            commit('ClearUser');
                            window.location.replace('/');
                        }
                    }
                    
                },
                error: function(msg) {
                    if (state.isLogin) {
                        commit('ClearUser');
                        window.location.replace('/');
                    }
                }
            })
        },
        Logoff({commit, state}) {
            $.ajax( {
                url: server_url+"/logoff",
                method: "POST",
                dataType: "json",
                contentType: 'application/json;charset=UTF-8',
                data: JSON.stringify({"username": state.username, "token":state.token}),
                success: function(msg) {
                    commit('ClearUser');
                },
                error: function(msg) {
                    commit('ClearUser');
                }
            })
        }
    }
})
Vue.component('register', {
    computed: {
        isLogin: function() {
            return store.state.isLogin;
        },
        username: function() {
            return store.state.username;
        }
    },
    methods: {
        Logoff: function() {
            store.dispatch('Logoff');
        }
    },
    mounted() {
        store.dispatch("CheckTokenValid");
    }
});

Vue.component('v-imageupload', {
    props: ['url'],
    data: function() {
        return {
            tag: "",
            tags: [],
            err_msg: "",
            gender: "",
            availableTags: [],
        }
    },
    methods: {
        ChooseGender: function(g) {
            this.gender = g;
        },
        AddTag: function() {
            if (this.availableTags.indexOf($('#tags').val()) >= 0 && 
                this.tags.indexOf($('#tags').val()) == -1) {
                this.tag = $('#tags').val();
                this.tags.push(this.tag);
            }
        },
        RemoveTag: function(t) {
            var idx = this.tags.indexOf(t)
            if (idx > -1) {
                this.tags.splice(idx, 1);
            }
        },
        Finish: function() {
            if (this.gender != 'm' && this.gender != 'f') {
                this.err_msg = '请选择性别';
                return;
            }
            var v = this;
            $.ajax({
                url: server_url+"/addimage",
                method: "POST",
                dataType: "json",
                contentType: 'application/json;charset=UTF-8',
                data: JSON.stringify({
                    "url": v.url, 
                    "owner": store.state.username, 
                    "gender": v.gender,
                    "tags": v.tags,
                }),
                success: function(msg) {
                    v.tags = [];
                    v.err_msg = "";
                    v.gender = "";
                    v.tag = "";
                    v.$emit("finish");
                },
                error: function(xhr) {
                    v.err_msg = JSON.parse(xhr['responseText'])["msg"];
                }
            })

        },
    },
    mounted() {
        this.availableTags=['java', 'javascript', 'python'];
        $("#tags").autocomplete({source: this.availableTags});
    }
});

var v_nav = new Vue ( {
    el: '#top_nav',
    data: {
        category: "全部"
    },
    methods : {
        ChangeContent: function(c) {
            $('#header-collapse').collapse('hide');
            v_main.currPage = c;
        }
    },
});
var v_main = new Vue( {
    el: '#main_content',
    store,
    data: {
        currPage: "home",
        uploadImageUrl: ""
    },
    methods: {
        UploadImage: function(url) {
            this.uploadImageUrl = url;
        }
    },
})
var v_login = new Vue( {
    el: '#login_modal',
    data: {
        signup_email_val:"",
        signup_username_val: "",
        signup_username_err_msg: "",
        signup_password_val: "",
        signup_password_again_val: "",
        login_username_val: "",
        login_password_val: "",
        login_remember_val: "",
        email_valid: true,
        username_valid: true,
        password_valid: true,
        password_again_valid: true,

        err_login: false,
        err_login_msg: "",
        err_reg: false,
        err_reg_msg: ""
    },
    methods: {
        Register: function() {
            var v = this;
            $.ajax({
                url: server_url+"/register",
                method: "POST",
                dataType: "json",
                contentType: 'application/json;charset=UTF-8',
                data: JSON.stringify({"username": this.signup_username_val, "password": this.signup_password_val, "email": this.signup_email_val}),
                success: function(msg) {
                    v_login.err_reg = false;
                    store.commit("SetUser", {"username":v.signup_username_val, "token":msg['token']});
                    store.commit('SetLogin', true);
                    setTimeout(function() {
                        window.location.replace('/')},
                        500
                    );
                },
                error: function(xhr) {
                    v_login.err_reg = true;
                    v_login.err_reg_msg = JSON.parse(xhr['responseText'])["msg"];
                }
            })
        },
        Login: function() {
            $.ajax({
                url: server_url+"/login",
                method: "POST",
                dataType: "json",
                contentType: 'application/json;charset=UTF-8',
                data: JSON.stringify({"username": this.login_username_val, 
                    "password": this.login_password_val,
                    "remember": this.login_remember_val
                }),
                success: function(msg) {
                    v_login.err_login = false;
                    store.commit('SetUser', {"username":msg["username"], "token":msg['token']});
                    store.commit('SetLogin', true);
                    setTimeout(function() {
                        window.location.replace('/')},
                        500
                    );
                },
                error: function(xhr) {
                    v_login.err_login = true;
                    v_login.err_login_msg = JSON.parse(xhr['responseText'])["msg"]
                }
            })
        },
        CheckEmailValid: function() {
            if (this.signup_email_val == "") {
                this.email_valid = true
            }
            var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
            this.email_valid = re.test(this.signup_email_val);
        },
        CheckUsernameValid: function() {
            this.username_valid = (this.signup_username_val.length >= 2 && this.signup_username_val.length <= 50)
            if (this.username_valid) {
                $.ajax( {
                    url: server_url+"/uservalid",
                    method: "POST",
                    dataType: "json",
                    contentType: 'application/json;charset=UTF-8',
                    data: JSON.stringify({"username": this.signup_username_val}),
                    success: function(msg) {
                        if (msg["valid"] == true) {
                            v_login.username_valid = false;
                            v_login.signup_username_err_msg = "用户名已被占用"
                        } else {
                            v_login.username_valid = true;
                        }
                    }
                })
            } else {
                this.signup_username_err_msg = "用户名长度错误！"
            }
        },
        CheckPasswordValid: function() {
            this.password_valid = (this.signup_password_val.length >= 8)
        },
        CheckPasswordAgainValid: function() {
            this.password_again_valid = (this.signup_password_val == this.signup_password_again_val);
        }
    }
}) 
UpdateFileUpload = function() {
    var d = new Date();
    var t = d.getTime();
    var data = {
        "timestamp": t,
        "callback": "/cloudinary_cors.html",
        "api_key": "585812587869167",
    };
    $.ajax({
        url: server_url + '/signature',
        method: 'POST',
        dataType: "json",
        contentType: 'application/json;charset=UTF-8',
        data: JSON.stringify(data),
        success: function(msg) {
            console.log(msg);
            data["signature"] = msg["signature"];
            $(".cloudinary-fileupload").attr("data-form-data", JSON.stringify(data))
            $("input.cloudinary-fileupload[type=file]").cloudinary_fileupload();
            $('.cloudinary-fileupload').bind('fileuploadprogress', function(e, data) {
                $('.progress-bar').css('width', Math.round((data.loaded * 100.0)/data.total) + '%');
            });
            $('.cloudinary-fileupload').bind('fileuploaddone', function(e, data) {
                console.log(e);
                console.log(data);
                var path = data['result']['secure_url'];
                console.log(path)
                v_main.UploadImage(path);
            });
        },
        error: function(xhr) {
            console.log(xhr);
        },
    })
}
$(function() {
  if($.fn.cloudinary_fileupload !== undefined) {
    UpdateFileUpload();
  }
});
