/************************************************************************** 
* BTI325– Assignment 6
* I declare that this assignment is my own work in accordance with Seneca Academic Policy. No part 
* of this assignment has been copied manually or electronically from any other source*
* (including 3rd party web sites) or distributed to other students. 
* Name: Ian Henriquez  Student ID: 135226207 Date: 30-November-2022
* Your app’s URL (from CYCLIC) : 
* *************************************************************************/


var HTTP_PORT = process.env.PORT || 8080;
var express = require("express");
var multer = require("multer");
const fs = require("fs");
var app = express();
var path = require("path");
//var exphbs = require("express-handlebars");
const {engine} = require("express-handlebars");

var data = require("./data-service");
var dataServiceAuth = require("./data-service-auth");
var clientSessions = require("client-sessions");
app.use(clientSessions({
    cookieName: "session", // this is the object name that will be added to 'req'
    secret
: "bti325_a6", // this should be a long un-guessable string.
    duration: 2 * 60 * 1000, // duration of the session in milliseconds (2 minutes)
    activeDuration: 1000 * 60 // the session will be extended by this many ms each request (1 minute)
}));

app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.engine(".hbs", engine({
    extname: ".hbs",
    defaultLayout: "main",
    helpers: {
        navLink: function(url, options){ 
            return '<li' +
            ((url == app.locals.activeRoute) ? ' class="active" ' : '') +
            '><a href=" ' + url + ' ">' + options.fn(this) + '</a></li>'; 
        },
        equal: function (lvalue, rvalue, options) {
            if (arguments.length < 3)
                throw new Error("Handlebars Helper equal needs 2 parameters");
            if (lvalue != rvalue) {
                return options.inverse(this);
            } else {
                return options.fn(this);
            }
        }
    }
}));
app.set("view engine", ".hbs");

const storage = multer.diskStorage({
    destination: "./public/images/uploaded",
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }

})
const upload = multer({storage: storage});

function ensureLogin(req, res, next) {
    if(!req.session.user) {
        res.redirect("/login");
    } else {
        next();
    }
}

app.use(function (req, res, next) {
    let route = req.baseUrl + req.path;
    app.locals.activeRoute = (route == "/") ? "/" : route.replace(/\/$/, "");
    next();
});

app.use(function (req, res, next) {
    res.locals.session = req.session;
    next();
});

app.get("/", (req, res) => {
    res.render("home", {title: "Home", layout: "main"});
});


app.get("/about", (req, res) => {
    res.render("about", {title: "About", layout: "main"});
});

app.get("/employees/add",ensureLogin, (rew, res) =>{
    data.getDepartments().then((data) => { 
        res.render("addEmployee", {departments: data});
    }).catch(() => {
        res.render("addEmployee", {departments: []});
    });
});

app.get("/images/add",ensureLogin, (rew, res) =>{
    res.render("addImage", {title: "Add Image", layout: "main"});
})

app.get("/employees",ensureLogin,(req, res) => {
    if(req.query.status){{
        data.getEmployeesByStatus(req.query.status).then((jsonData) => {
            res.render("employees", {employees: jsonData, title: "Employees", layout: "main"});
        }).catch((err) => {
            res.render({message: "no results"});
        });
    }}
    else if(req.query.department){
        data.getEmployeesByDepartment(req.query.department).then((jsonData) => {
            res.render("employees", {employees: jsonData, title: "Employees", layout: "main"});
        }).catch((err) => {
            res.render({message: "no results"});
        });
    }
    else if(req.query.manager){
        data.getEmployeesByManager(req.query.manager).then((jsonData) => {
            res.render("employees", {employees: jsonData, title: "Employees", layout: "main"});
        }).catch((err) => {
            res.render({message: "no results"});
        });
    }
    else{
        data.getAllEmployees().then((jsonData) =>{
            if(jsonData.length > 0){
                res.render("employees", {employees: jsonData, title: "Employees", layout: "main"});
            }
            else{
                res.render({message: "no results"});
            }
        }).catch((err) =>{
            res.render("employees",{message: "no results"});
        });
    }
});

app.get("/employee/:num",ensureLogin, (req, res) => {
    let viewData = {};
    data.getEmployeeByNum(req.params.num).then((data) => {
        if(data){
            viewData.employee = data;
        }
        else{
            viewData.employee = null;
        }
    }
    ).catch(() => {
        viewData.employee = null;
    }).then(data.getDepartments).then((data) => {
        viewData.departments = data;
        for(let i = 0; i < viewData.departments.length; i++){
            if(viewData.departments[i].departmentId == viewData.employee.department){
                viewData.departments[i].selected = true;
            }
        }
    }).catch(() => {
        viewData.departments = [];
    }).then(() => {
        if(viewData.employee == null){
            res.status(404).send("Employee Not Found");
        }
        else{
            res.render("employee", { viewData: viewData });
        }
    });
});

app.get("/employees/delete/:num",ensureLogin, (req, res) => {
    data.deleteEmployeeByNum(req.params.num).then(() => {
        res.redirect("/employees");
    }).catch(() => {
        res.status(500).send("Unable to Remove Employee / Employee not found");
    });
});

app.get("/departments",ensureLogin, (req, res) => {
    data.getDepartments().then((jsonData)=>{
        if(jsonData.length > 0){
            res.render("departments", {departments: jsonData, title: "Departments", layout: "main"});
        }
        else{
            res.render("departments",{message: "no results"});
        }
    }).catch((err) =>{
        res.render("departments",{message: "no results"});
    })
});

app.get("/departments/add",ensureLogin, (req, res) => {
    res.render("addDepartment", {title: "Add Department", layout: "main"});
}); 

app.post("/departments/add",ensureLogin, (req, res) => {
    data.addDepartment(req.body).then(() => {
        res.redirect("/departments");
    }).catch((err) => {
        res.status(500).send("Unable to Add Department");
    });
});

app.post("/department/update",ensureLogin, (req, res) => {
    data.updateDepartment(req.body).then(() => {
        res.redirect("/departments");
    }).catch((err) => {
        res.status(500).send("Unable to Update Department");
    });
});

app.get("/department/:departmentId",ensureLogin, (req, res) => {
    data.getDepartmentById(req.params.departmentId).then((jsonData) => {
        if(jsonData){
            res.render("department", {department: jsonData, title: "Department", layout: "main"});
        }
        else{
            res.status(404).send("Department Not Found");
        }
    }).catch((err) => {
        res.status(404).send("Unable to get Department");
    });
});

app.post("/images/add", upload.single('imageFile'),ensureLogin, (req, res)=>{
    res.redirect("/images");
});

app.post("/employees/add",ensureLogin, (req, res) => {
    data.addEmployee(req.body).then(() => {
        res.redirect("/employees");
    }).catch((err) => {
        res.status(500).send("Unable to Add Employee");
    });
});

app.post("/employee/update",ensureLogin, (req, res) => { 
    data.updateEmployee(req.body).then(() => {
        res.redirect("/employees");
    }).catch((err) => {
        res.status(500).send("Unable to Update Employee");
    });
});

app.get("/images",ensureLogin, (req, res) =>{
    fs.readdir("./public/images/uploaded", function(err, items){
        res.render("images", {title: "Images", layout: "main", data: items});
    });
});

app.get("/login", (req, res) => {
    res.render("login", {title: "Login", layout: "main"});
});

app.post("/login", (req, res) => {
    req.body.userAgent = req.get('User-Agent');
    dataServiceAuth.checkUser(req.body).then((user) => {
        req.session.user = {
            userName: user.userName,
            email: user.email,
            loginHistory: user.loginHistory
        }
        console.log(req.session.user);
        res.redirect('/employees');
    }).catch((err) => {
        res.render('login', {errorMessage: err, userName: req.body.userName});
    });
});

app.get("/register", (req, res) => {
    res.render("register", {title: "Register", layout: "main"});
});

app.post("/register", (req, res) => {
    dataServiceAuth.registerUser(req.body).then(() => {
        res.render("register", {successMessage: "User created"});
    }).catch((err) => {
        res.render("register", {errorMessage: err, userName: req.body.userName});
    });
});

app.get("/logout", (req, res) => {
    req.session.reset();
    res.redirect('/');
});

app.get("/userHistory",ensureLogin, (req, res) => {
    res.render("userHistory", {title: "User History", layout: "main"});
});




app.use((req, res, next) => {
    res.status(404).send(' Error 404! Oops wrong turn! Page not found')
})

data.initialize()
.then(dataServiceAuth.initialize) 
.then(function(){
    app.listen(HTTP_PORT, function(){ 
        console.log("app listening on: " + HTTP_PORT)
    });
}).catch(function(err){
    console.log("unable to start server: " + err); 
});

