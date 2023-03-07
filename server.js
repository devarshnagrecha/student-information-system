if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
}

const mongoose = require('mongoose');
const express = require('express');
const bodyParser = require("body-parser");
const cors = require('cors');
const app = express();
const bcrypt = require('bcrypt');
const flash = require('express-flash');
const session = require('express-session');
const methodOverride = require('method-override');
const { type } = require("os");

const passportStudent = require('passport');
const passportInstructor = require('passport');
const passportAdmin = require('passport');

const initializePassportStudent = require('./passport-config-student');
const initializePassportInstructor = require('./passport-config-instructor');
const initializePassportAdmin = require('./passport-config-admin');

const { query } = require('express');

initializePassportStudent(
    passportStudent,
    email => Student.findOne({ email: email }),
    id => id
);

initializePassportInstructor(
    passportInstructor,
    email => Instructor.findOne({ email: email }),
    id => id
);

initializePassportAdmin(
    passportAdmin,
    email => Admin.findOne({ email: email }),
    id => id
);

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(express.urlencoded({ extended: false }));
app.use(express.static(__dirname + '/public'));

app.use(flash());
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}))

app.use(passportStudent.initialize());
app.use(passportStudent.session());

app.use(passportInstructor.initialize());
app.use(passportInstructor.session());

app.use(passportAdmin.initialize());
app.use(passportAdmin.session());

app.use(methodOverride('_method'))
app.set('view engine', 'ejs');
mongoose.set('strictQuery', true);
mongoose.connect(`mongodb+srv://devarsh_nagrecha:${process.env.PASSWORD}@cluster0.vqnm6ti.mongodb.net/SIS-Sprint1`, { useNewUrlParser: true });

const saltRounds = 10;

const degreeSchema = new mongoose.Schema({
    name: String
})

const branchSchema = new mongoose.Schema({
    name: String
})

const courseSchema = new mongoose.Schema({
    name: String,
    code: String,
    credits: Number,
    description: String
});

const programSchema = new mongoose.Schema({
    degreeOffered: { type: mongoose.Schema.Types.ObjectId, ref: 'Degree' },
    branchOffered: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
    coursesOffered: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }]
})

const semesterSchema = new mongoose.Schema({
    name: String,
    programsOffered: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Program' }]
})

const studentSchema = new mongoose.Schema({
    firstname: String,
    middlename: String,
    lastname: String,
    studentID: String,
    mobileNO: String,
    email: String,
    password: String,
    dob: Date,
    gender: String,
    programRegistered: { type: mongoose.Schema.Types.ObjectId, ref: 'Program' },
});

const adminSchema = new mongoose.Schema({
    email: String,
    password: String
});

const instructorSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String
})

const courseAssignmentSchema = new mongoose.Schema({
    courseAssigned: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
    instructorAssigned: { type: mongoose.Schema.Types.ObjectId, ref: 'Instructor' },
    semesterAssigned: { type: mongoose.Schema.Types.ObjectId, ref: 'Semester' }
})

const courseEnrollmentSchema = new mongoose.Schema({
    courseAssigned: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
    instructorAssigned: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
    semesterAssigned: { type: mongoose.Schema.Types.ObjectId, ref: 'Semester' }
})


const Branch = mongoose.model("Branch", branchSchema);
const Degree = mongoose.model("Degree", degreeSchema);
const Course = mongoose.model("Course", courseSchema);
const Program = mongoose.model("Program", programSchema);
const Semester = mongoose.model("Semester", semesterSchema);


const Admin = mongoose.model("Admin", adminSchema);
const Student = mongoose.model("Student", studentSchema);
const Instructor = mongoose.model("Instructor", instructorSchema);

const CourseAssignment = mongoose.model("CourseAssignment", courseAssignmentSchema);
const CourseEnrollment = mongoose.model("CourseEnrollment", courseEnrollmentSchema);

app.get('/adminHome', (req, res) => {
    res.render('adminHome.ejs');
});

app.get('/addCourse', (req, res) => {
    res.render('addCourse.ejs');
});

app.post('/addCourse', (req, res) => {

    const newCourse = new Course({
        name: req.body.name,
        code: req.body.code,
        credits: req.body.credits,
        description: req.body.description
    });

    newCourse.save();
    res.redirect('/adminHome');
});

app.get('/addDegree', (req, res) => {
    res.render('addDegree.ejs');
});

app.post('/addDegree', (req, res) => {

    const newDegree = new Degree({
        name: req.body.name
    });

    newDegree.save();
    res.redirect('/adminHome');
});

app.get('/addBranch', (req, res) => {
    res.render('addBranch.ejs');
});

app.post('/addBranch', (req, res) => {

    const newBranch = new Branch({
        name: req.body.name
    });

    newBranch.save();
    res.redirect('/adminHome');
});

app.get('/addProgram', (req, res) => {
    Degree.find({})
        .then((degree) => {
            Branch.find({})
                .then((branch) => {
                    Course.find({})
                        .then((course) => {
                            res.render('addProgram.ejs', { degree, branch, course });
                        })
                        .catch((err) => {
                            console.error(err);
                        });
                })
                .catch((err) => {
                    console.error(err);
                });
        })
        .catch((err) => {
            console.error(err);
        });
})

app.post('/addProgram', (req, res) => {

    Degree.findById(req.body.degree)
        .then((degree) => {
            Branch.findById(req.body.branch)
                .then((branch) => {

                    Course.find({ '_id': { $in: req.body.course } })
                        .then((course) => {
                            const newProgram = new Program({
                                degreeOffered: degree,
                                branchOffered: branch,
                                coursesOffered: course
                            });

                            newProgram.save();
                            console.log(newProgram);
                            res.redirect('/adminHome');
                        })
                        .catch((err) => {
                            console.error(err);
                        });
                })
                .catch((err) => {
                    console.error(err);
                });
        })
        .catch((err) => {
            console.error(err);
        });
})

app.get('/addSemester', (req, res) => {

    Program.find({})
        .populate(['degreeOffered', 'branchOffered', 'coursesOffered'])
        .exec()
        .then((program) => {
            res.render('addSemester.ejs', {program});
        })
        .catch((err) => {
            console.log(err);
        });
});

app.listen(3000, function () {
    console.log("Server started on port 3000");
});