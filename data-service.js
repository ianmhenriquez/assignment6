const Sequelize = require('sequelize');

var sequelize = new Sequelize('ballnvhi', 'ballnvhi', 'sZimvFipBSevaqnB9ibAIvHkyXfpFCRv', {
    host: 'peanut.db.elephantsql.com',
    dialect: 'postgres', 
    port: 5432, 
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false
        }
    }
});

sequelize.authenticate().then(
    () => console.log('Connection success.')).catch(
        (err) => console.log("Unable to connect to DB.", err));


var Employee = sequelize.define("Employee", {
    employeeNum: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    firstName: Sequelize.STRING,
    lastName: Sequelize.STRING,
    email: Sequelize.STRING,
    SSN: Sequelize.STRING,
    addressStreet: Sequelize.STRING,
    addressCity: Sequelize.STRING,
    addressState: Sequelize.STRING,
    addressPostal: Sequelize.STRING,
    maritalStatus: Sequelize.STRING,
    isManager: Sequelize.BOOLEAN,
    employeeManagerNum: Sequelize.INTEGER,
    status: Sequelize.STRING,
    department: Sequelize.INTEGER,
    hireDate: Sequelize.STRING
});

var Department = sequelize.define("Department", {
    departmentId: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    departmentName: Sequelize.STRING
});

exports.initialize = function () {
    return new Promise(function (resolve, reject) {
        sequelize.sync().then(() => {
            resolve();
        }).catch(() => {
            reject("unable to sync the database");
        });
    });
}

exports.getAllEmployees = function () {
    return new Promise(function (resolve, reject) {
        Employee.findAll({raw: true}).then((data) => {
            resolve(data);
        }).catch(() => {
            reject("no results returned");
        });
    });
}

exports.deleteEmployeeByNum = function (empNum) {
    return new Promise(function (resolve, reject) {
        Employee.destroy({
            where: {
                employeeNum: empNum
            }
        }).then(() => {
            resolve();
        }).catch(() => {
            reject("unable to delete employee");
        });
    });
}

exports.getManagers = function () {
    return new Promise(function (resolve, reject) {
        reject();
    });
}

exports.getDepartments = function () {
    return new Promise((resolve, reject) =>{
        Department.findAll({raw: true}).then((data) => {
            resolve(data);
        }).catch(() => {
            reject("no results returned");
        });
    })
}

exports.addDepartment = function (departmentData) {
    return new Promise(function (resolve, reject) {
        for (var i in departmentData) {
            if (departmentData[i] == "") {
                departmentData[i] = null;
            }
        }
        Department.create(departmentData).then(() => {
            resolve();
        }).catch(() => {
            reject("unable to create department");
        });
    });
}

exports.updateDepartment = function (departmentData) {
    return new Promise(function (resolve, reject) {
        for (var i in departmentData) {
            if (departmentData[i] == "") {
                departmentData[i] = null;
            }
        }
        Department.update({
            departmentId: departmentData.departmentId,
            departmentName: departmentData.departmentName
        }, { where: { departmentId: departmentData.departmentId } }).then(() => {
            resolve();
        }).catch(() => {
            reject("unable to update department");
        });
    });
}

exports.getDepartmentById = function (id) { 
    return new Promise(function (resolve, reject) {
        Department.findAll({
            where: { departmentId: id }, raw: true
        }).then((data) => {
            resolve(data[0]);
        }).catch(() => {
            reject("no results returned");
        });
    });
}

exports.addEmployee = function (employeeData) {
    return new Promise(function (resolve, reject) {
        employeeData.isManager = (employeeData.isManager) ? true : false;
        for (var prop in employeeData) {
            if (employeeData[prop] == "") {
                employeeData[prop] = null;
            }
        }
        Employee.create(employeeData).then(() => {
            resolve();
        }).catch(() => {
            reject("unable to create employee");
        });
    });
}

exports.getEmployeesByStatus = function (status) {
    return new Promise(function (resolve, reject) {
        //remove %20 from status
        status = status.replace("%20", " ");
        Employee.findAll({where:{status: status}, raw: true}).then((data) => {
            resolve(data);
        }).catch(() => {
            reject("no results returned");
        });
    });
}

exports.getEmployeesByDepartment = function (department) {
    return new Promise(function (resolve, reject) {
        Employee.findAll({where:{department: department}, raw:true}).then((data) => {
            resolve(data);
        }).catch(() => {
            reject("no results returned");
        });
    });
}

exports.getEmployeesByManager = function (manager) {
    return new Promise(function (resolve, reject) {
        Employee.findAll({where:{employeeManagerNum: manager}, raw: true}).then((data) => {
            resolve(data);
        }).catch(() => {
            reject("no results returned");
        });
    });
}

exports.getEmployeeByNum = function (num) {
    return new Promise(function (resolve, reject) {
        Employee.findAll({where:{employeeNum: num}, raw:true}).then((data) => {
            resolve(data[0]);
        }).catch(() => {
            reject("no results returned");
        });
    });
}

exports.updateEmployee = function (employeeData) {
    return new Promise(function (resolve, reject) {
        employeeData.isManager = (employeeData.isManager) ? true : false;
        for (var prop in employeeData) {
            if (employeeData[prop] == "") {
                employeeData[prop] = null;
            }
        }
        Employee.update(employeeData, {where: {employeeNum: employeeData.employeeNum}}).then(() => {
            resolve();
        }).catch(() => {
            reject("unable to create employee");
        });
    });
}




