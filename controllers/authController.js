const conn = require("../config/sequelizeConfig");
const fs = require("fs");
const bcrypt = require("bcrypt");
const userUpload = require("../libs/users");
const saltRounds = 10;
const {models} = require("../models/index");
const jwt = require("jsonwebtoken");
const storage = require("../libs/handyStorage");
const usersUpload = require("../libs/users");
const handle = require("../libs/promiseHandler");

const authController = {
    showRegister: (req, res) => {
        res.render("./register");
    },
    register: (req, res) => {
        if(conn.error){
            res.status(500);
        }else{
           userUpload(req, res, (err) => {
             
                if(err) {
                   res.status(500).json({error: err});
                }else{
                    if(req.body.email === "" || req.body.password === ""){
                        //at this point the image is being uploaded for some reason***
                        //so we need to remove it
                        let avatarsPath = `./users/avatars/${req.file.filename}`;
                        fs.unlinkSync(avatarsPath, (err) => {
                            if(err){
                                res.status(500).json({error: err});
                            }
                        });
                        res.status(500).json({error: "Please fill all the details"});  
                    }else{
                        //everything went OK, continue
                        //enctrypt the password
                        let hash = bcrypt.hashSync(req.body.password, saltRounds);

                        //save the user
                        models.User.create({
                            email: req.body.email,
                            password: hash,
                            avatarUrl: req.file.filename,
                            avatarname: req.file.filename
                        }).then((user) => {
                            //console.log(user);
                            //set the token and user values
                            let token = jwt.sign({user: req.body.email}, "supersecretpassword", {expiresIn: '2h'});
                            

                            res.status(200).json({token: token});
                        }).catch(err => {
                            //console.log(err);
                            let avatarsPath = `./users/avatars/${req.file.filename}`;
                            fs.unlinkSync(avatarsPath, (err) => {
                               if(err){
                                res.status(500).json({error: err});
                               }
                            });
                            res.status(500).json({error: err});
                        })

                    }


                }
                
           }); 
        }



    },
    login: (req, res) => {
        usersUpload(req, res, async(err) => {
            if(err){
                res.status(500).json({error: err});
            }

            //TODO--- check if the email exists first
            

            //checking the email
            const [user, userError] = await handle(models.User.findOne({
                where: {email: req.body.email},
                /*
                include: [{model: models.Post }]
                */
            })); 

            if(userError){
                res.status(500).json({error: err});
            }
            if(user){
                let password = req.body.password;
                let userHash = user.dataValues.password;

                bcrypt.compare(password, userHash, (err, success) =>{
                    if(!success){
                        res.status(500).json({error: err});
                       
                    }else{

                       let token = jwt.sign({user: req.body.email}, "supersecretpassword", {expiresIn: "2h"});

                        /*
                        storage.setState({
                            token: jwt.sign({user: req.body.email}, "supersecretpassword", {expiresIn: "2h"}),
                            user: user.dataValues
                        });
                        */
/*
                        user.Posts.map(p => {
                            console.log(p.dataValues);
                        });
*/
                        //return the token
                        res.status(200).json({token: token});

                    }


                })

            }


        })



    },
    logout: (req, res) => {
      storage.setState({
          token: "",
          user: ""
      });
      res.redirect("/auth/login");
    },
    showDashboard: (req, res) => {
    /*
       models.User.findOne({
           where: {email: storage.state.user.email},
           include: [{
               model: models.Post
           }]
       }).then(user => {
        res.render("./dashboard", {user: user.dataValues});

       }).catch(err => {
           res.status(500);
       })
  */    
    }

}

module.exports = authController;