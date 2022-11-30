var mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
var Schema = mongoose.Schema;

var uri = "mongodb+srv://dbUser:dbUserPassword@senecaweb.ytvnlnu.mongodb.net/?retryWrites=true&w=majority";
mongoose.connect(uri, {useNewUrlParser: true, useUnifiedTopology: true}, function(err) {
    if(err) {
        console.log('Error connecting to: ' + uri + '. ' + err);
    } else {
        console.log('Succeeded connected to: ' + uri);
    }
});

var userSchema = new Schema({
    userName: {type: String, required: true, unique: true},
    password: {type: String, required: true},
    email: {type: String, required: true, unique: true},
    loginHistory: [{dateTime: Date, userAgent: String}]
});

let User; // to be defined on new connection (see initialize)

module.exports.initialize = function() {
    return new Promise(function(resolve, reject) {
        let db = mongoose.createConnection(uri);
        db.on('error', (err) => {
            reject(err); // reject the promise with the provided error
        });
        db.once('open', () => {
            User = db.model("users", userSchema);
            resolve();
        });
    });
}

module.exports.registerUser = function(userData) {
    return new Promise(function(resolve, reject) {
        if(userData.password != userData.password2) {
            reject("Passwords do not match");
        } else {
            bcrypt.genSalt(10, function(err, salt) { // Generate a "salt" using 10 rounds
                bcrypt.hash(userData.password, salt, function(err, hash) { // encrypt the password: "myPassword
                    if(err) {
                        reject("There was an error encrypting the password");
                    }
                    else {
                        userData.password = hash;
                        let newUser = new User(userData);
                        newUser.save((err) => {
                            if(err) {
                                if(err.code == 11000) {
                                    reject("User Name already taken");
                                } else {
                                    reject("There was an error creating the user: " + err);
                                }
                            } else {
                                resolve();
                            }
                        });
                    }
                });
            });   
        }
    });
}

module.exports.checkUser = function(userData) {
    console.log(userData);
    return new Promise(function(resolve, reject) {
        User.find({userName : userData.userName})
        .exec()
        .then((users) => {
            console.log(users);
            if(!users) {
                reject("Unable to find user: " + userData.userName);
            } else {
                bcrypt.compare(userData.password, users[0].password).then((res) => {

                    if(res === true) {
                        users[0].loginHistory.push({dateTime: (new Date()).toString(), userAgent: userData.userAgent});
                        User.update(
                            { userName: users[0].userName },
                            { $set: { loginHistory: users[0].loginHistory }},
                            { multi: false }
                        )
                        .exec()
                        .then(() => {
                            resolve(users[0]);
                        })
                        .catch((err) => {
                            reject("There was an error verifying the user: " + err);
                        });
                    } else {
                        reject("Incorrect Password for user: " + userData.userName);
                    }
                });
            }
        }
        ).catch((err) => {
            reject("Unable to find user: " + userData.userName);
        }
        );
    });
}
