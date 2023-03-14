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
const PDFDocument = require('pdfkit');
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
    name: String
    // email: String,
    // password: String
})

const courseAssignmentSchema = new mongoose.Schema({
    programAssigned: { type: mongoose.Schema.Types.ObjectId, ref: 'Program' },
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

app.get('/', (req,res) => {
    res.render('/index.ejs');
})

app.get('/adminHome', (req, res) => {
    res.render('adminHome.ejs');
});

app.get('/viewCourse', (req, res) => {

    Course.find({})
        .then((course) => {
            res.render('viewCourse.ejs', { course });
        })
        .catch((err) => {
            console.error(err);
        });
});

app.post('/viewCourse', (req, res) => {
    if (req.body.delete) {
        Course.deleteOne({ _id: req.body.delete })
            .then(() => {
                Course.find({})
                    .then((course) => {
                        res.render('viewCourse.ejs', { course });
                    })
                    .catch((err) => {
                        console.error(err);
                    });
            })
            .catch((err) => {
                console.error(err);
            });
    }

    else {
        Course.findOne({ _id: req.body.edit })
            .then((course) => {
                res.render('updateCourse.ejs', { course });
            })
            .catch((err) => {
                console.error(err);
            });

    }
})

app.post('/updateCourse', (req, res) => {
    Course.updateOne({ _id: req.body.btn }, { name: req.body.name, credits: req.body.credits, code: req.body.code, description: req.body.description })
        .then(() => {
            Course.find({})
                .then((course) => {
                    res.render('viewCourse.ejs', { course });
                })
                .catch((err) => {
                    console.error(err);
                });
        })
        .catch((err) => {
            console.error(err);
        });
})

app.get('/viewDegree', (req, res) => {

    Degree.find({})
        .then((degree) => {
            res.render('viewDegree.ejs', { degree });
        })
        .catch((err) => {
            console.error(err);
        });
});

app.post('/viewDegree', (req, res) => {
    if (req.body.delete) {
        Degree.deleteOne({ _id: req.body.delete })
            .then(() => {
                Degree.find({})
                    .then((degree) => {
                        res.render('viewDegree.ejs', { degree });
                    })
                    .catch((err) => {
                        console.error(err);
                    });
            })
            .catch((err) => {
                console.error(err);
            });
    }

    else {
        Degree.findOne({ _id: req.body.edit })
            .then((degree) => {
                res.render('updateDegree.ejs', { degree });
            })
            .catch((err) => {
                console.error(err);
            });

    }
})

app.post('/updateDegree', (req, res) => {
    Degree.updateOne({ _id: req.body.btn }, { name: req.body.name })
        .then(() => {
            Degree.find({})
                .then((degree) => {
                    res.render('viewDegree.ejs', { degree });
                })
                .catch((err) => {
                    console.error(err);
                });
        })
        .catch((err) => {
            console.error(err);
        });
})


app.get('/viewBranch', (req, res) => {

    Branch.find({})
        .then((branch) => {
            res.render('viewBranch.ejs', { branch });
        })
        .catch((err) => {
            console.error(err);
        });
});

app.post('/viewBranch', (req, res) => {
    if (req.body.delete) {
        Branch.deleteOne({ _id: req.body.delete })
            .then(() => {
                Branch.find({})
                    .then((branch) => {
                        res.render('viewBranch.ejs', { branch });
                    })
                    .catch((err) => {
                        console.error(err);
                    });
            })
            .catch((err) => {
                console.error(err);
            });
    }

    else {
        Branch.findOne({ _id: req.body.edit })
            .then((branch) => {
                res.render('updateBranch.ejs', { branch });
            })
            .catch((err) => {
                console.error(err);
            });

    }
})

app.post('/updateBranch', (req, res) => {
    Branch.updateOne({ _id: req.body.btn }, { name: req.body.name })
        .then(() => {
            Branch.find({})
                .then((branch) => {
                    res.render('viewBranch.ejs', { branch });
                })
                .catch((err) => {
                    console.error(err);
                });
        })
        .catch((err) => {
            console.error(err);
        });
})

app.get('/viewProgram', (req, res) => {

    Program.find({})
        .populate(['degreeOffered', 'branchOffered', 'coursesOffered'])
        .exec()
        .then((program) => {
            res.render('viewProgram.ejs', { program });
        })
        .catch((err) => {
            console.log(err);
        });
});

app.post('/viewProgram', (req, res) => {
    if (req.body.delete) {
        Program.deleteOne({ _id: req.body.delete })
            .then(() => {
                Program.find({})
                    .then((program) => {
                        res.render('viewProgram.ejs', { program });
                    })
                    .catch((err) => {
                        console.error(err);
                    });
            })
            .catch((err) => {
                console.error(err);
            });
    }

    else {
        Program.findOne({ _id: req.body.edit })
            .then((program) => {
                res.render('updateProgram.ejs', { program });
            })
            .catch((err) => {
                console.error(err);
            });

    }
})

app.get('/viewSemester', (req, res) => {

    Semester.find({})
        .then((semester) => {
            res.render('viewSemester.ejs', { semester });
        })
        .catch((err) => {
            console.error(err);
        });
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
    res.redirect('/viewCourse');
});

app.get('/addDegree', (req, res) => {
    res.render('addDegree.ejs');
});

app.post('/addDegree', (req, res) => {

    const newDegree = new Degree({
        name: req.body.name
    });

    newDegree.save();
    res.redirect('/viewDegree');
});

app.get('/addBranch', (req, res) => {
    res.render('addBranch.ejs');
});

app.post('/addBranch', (req, res) => {

    const newBranch = new Branch({
        name: req.body.name
    });

    newBranch.save();
    res.redirect('/viewBranch');
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
                            res.redirect('/viewProgram');
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
            res.render('addSemester.ejs', { program });
        })
        .catch((err) => {
            console.log(err);
        });
});

app.post('/addSemester', (req, res) => {

    const newSemester = new Semester({
        name: req.body.name,
        programsOffered: req.body.program

    });

    newSemester.save()
        .then(savedSemester => {
            return Semester.populate(savedSemester, {
                path: 'programsOffered',
                populate: [
                    { path: 'degreeOffered', model: Degree },
                    { path: 'branchOffered', model: Branch },
                    { path: 'coursesOffered', model: Course }
                ]
            });
        })
        .then(populatedSemester => {

            Instructor.find({})
                .then((instructor) => {
                    res.render('assignCourse.ejs', { populatedSemester, instructor });
                })
                .catch(err => {
                    console.error(err);
                });
        })
        .catch(err => {
            console.error(err);
        });

})

app.post('/assignCourse', (req, res) => {

    for (var i = 0; i < req.body.courseAssigned.length; i++) {

        const tuple = req.body.courseAssigned[i].split(" ");

        Semester.findById(tuple[0])
            .then((semester) => {
                Program.findById(tuple[1])
                    .then((program) => {
                        Course.findById(tuple[2])
                            .then((course) => {
                                Instructor.findById(tuple[3])
                                    .then((instructor) => {
                                        const newCourseAssignment = new CourseAssignment({
                                            semesterAssigned: semester,
                                            programAssigned: program,
                                            courseAssigned: course,
                                            instructorAssigned: instructor
                                        });

                                        newCourseAssignment.save();
                                    })
                                    .catch(err => {
                                        console.error(err);
                                    });
                            })
                            .catch(err => {
                                console.error(err);
                            });
                    })
                    .catch(err => {
                        console.error(err);
                    });
            })
            .catch(err => {
                console.error(err);
            });
    }
    res.redirect('/viewSemester');
})

app.get('/generate-pdf', (req, res) => {
    const doc = new PDFDocument();
    doc.pipe(res);

    // fetch data from the database

    CourseAssignment.find({ _id: req.body.btn })
        .then((semester) => {

            doc.font('Helvetica-Bold');
            const tableHeaders = ['ID', 'Name', 'Email'];
            const tableRows = users.map(user => [user._id, user.name, user.email]);
            doc.table([tableHeaders, ...tableRows], {
                prepareHeader: () => doc.font('Helvetica-Bold'),
                prepareRow: (row, i) => doc.font('Helvetica').fontSize(10)
            })

            doc.end();

            // finish and send the PDF document

        })
        .catch(err => {
            console.error(err);
        });
});

app.listen(3000, function () {
    console.log("Server started on port 3000");
});