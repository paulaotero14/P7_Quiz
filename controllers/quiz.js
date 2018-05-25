const Sequelize = require("sequelize");
const {models} = require("../models");

// Autoload the quiz with id equals to :quizId
exports.load = (req, res, next, quizId) => {

    models.quizzes.findById(quizId)
    //lo que encuentra es quiz
    .then(quiz => {
        if (quiz) {
            //encontramos el quiz con ese id
            req.quiz = quiz;
            next();
        } else {
            throw new Error('There is no quiz with id=' + quizId);
        }
    })
    .catch(error => next(error));
};


// GET /quizzes
exports.index = (req, res, next) => {

    models.quizzes.findAll()
    .then(quizzes => {
        //cargo todos los quizzes en la vista index
        res.render('quizzes/index.ejs', {quizzes});
    })
    .catch(error => next(error));
};


// GET /quizzes/:quizId
exports.show = (req, res, next) => {

    const {quiz} = req;

    res.render('quizzes/show', {quiz});
};


// GET /quizzes/new
exports.new = (req, res, next) => {

    const quiz = {
        question: "", 
        answer: ""
    };

    res.render('quizzes/new', {quiz});
};

// POST /quizzes/create
exports.create = (req, res, next) => {

    const {question, answer} = req.body;

    const quiz = models.quizzes.build({
        question,
        answer
    });

    // Saves only the fields question and answer into the DDBB
    quiz.save({fields: ["question", "answer"]})
    .then(quiz => {
        req.flash('success', 'Quiz created successfully.');
        res.redirect('/quizzes/' + quiz.id);
    })
    .catch(Sequelize.ValidationError, error => {
        req.flash('error', 'There are errors in the form:');
        error.errors.forEach(({message}) => req.flash('error', message));
        res.render('quizzes/new', {quiz});
    })
    .catch(error => {
        req.flash('error', 'Error creating a new Quiz: ' + error.message);
        next(error);
    });
};


// GET /quizzes/:quizId/edit
exports.edit = (req, res, next) => {

    const {quiz} = req;

    res.render('quizzes/edit', {quiz});
};


// PUT /quizzes/:quizId
exports.update = (req, res, next) => {

    const {quiz, body} = req;

    quiz.question = body.question;
    quiz.answer = body.answer;

    quiz.save({fields: ["question", "answer"]})
    .then(quiz => {
        req.flash('success', 'Quiz edited successfully.');
        res.redirect('/quizzes/' + quiz.id);
    })
    //CAPTURA DE ERRORES
    .catch(Sequelize.ValidationError, error => {
        req.flash('error', 'There are errors in the form:');
        error.errors.forEach(({message}) => req.flash('error', message));
        res.render('quizzes/edit', {quiz});
    })
    .catch(error => {
        req.flash('error', 'Error editing the Quiz: ' + error.message);
        next(error);
    });
};


// DELETE /quizzes/:quizId
exports.destroy = (req, res, next) => {

    req.quiz.destroy()
    .then(() => {
        req.flash('success', 'Quiz deleted successfully.');
        res.redirect('/quizzes');
    })
    .catch(error => {
        req.flash('error', 'Error deleting the Quiz: ' + error.message);
        next(error);
    });
};


// GET /quizzes/:quizId/play
exports.play = (req, res, next) => {

    const {quiz, query} = req;

    const answer = query.answer || '';

    res.render('quizzes/play', {
        quiz,
        answer
    });
};


// GET /quizzes/:quizId/check
exports.check = (req, res, next) => {

    const {quiz, query} = req;

    const answer = query.answer || "";
    const result = answer.toLowerCase().trim() === quiz.answer.toLowerCase().trim();

    res.render('quizzes/result', {
        quiz,
        result,
        answer
    })
};

// GET /quizzes/randomplay
exports.randomplay = (req, res, next) => {
 
    if(req.session.ramdomplay === undefined){
        req.session.randomplay = [];  
      }

      var aux = [];

      Sequelize.Promise.resolve()
      .then(function(){
          return models.quizzes.findAll();
      })
      .then(function(quizzes){
          for(var i = 0; i<quizzes.length; i++){
              aux.push(quizzes[i]);
          }
          let rand = parseInt(Math.random() * aux.length)
          return aux[rand]
      })
      .then(function(quiz){
        const score = req.session.randomplay.length;
        if(quiz){
            res.render('random_play', { quiz, score });
        } else {
            // Hemos acabado.
            delete req.session.randomplay;
            res.render('random_nomore', { score });
        }
        
    
      })
      .catch(function (error) {
        next(error);
    });
    };

// GET /quizzes/randomcheck/:quizId?answer=respuesta
exports.randomcheck = (req, res, next) => {
    
    var quiz = models.quizzes.find
    var quizId = req.params.quizId
    var answer = req.query.answer

    models.quizzes.findById(quizId)
    .then(quiz => {
        score = req.session.randomplay.length
        let result = true
        if (quiz.answer.toLowerCase().trim() == answer.toLowerCase().trim()) {

            req.session.randomplay.push(quiz.id)
            score = req.session.randomplay.length
            if (score == req.session.total) {
                
                req.session.randomplay = []
                res.render('random_nomore',{
                    score
                })
            } else {
                res.render('random_result', {
                    score,
                    answer,
                    result
                })
            }
        } else {
            req.session.randomplay = []
            result = false
            res.render('random_result',{
               score,
               answer,
               result
            })
        }
    })
    .catch(error => next(error));
}

