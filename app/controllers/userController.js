const { User, Post } = require("../models");

/* Asserts
** We use "Assert" a Node's module wich say "If condition is false, I show an error)"
*/
const assert = require('assert');

module.exports = { 
    /**
     * Get details of one user 
     * @param {object} req HTTP request to Express app
     * @param {object} res HTTP response from Express app
     * @return {object} Response with JSON 
     */
    async getUser(req,res){
        try {
            const foundUser = await User.findOne(
                {   
                    attributes: ['firstname','lastname','email'],
                    where : {
                        id: req.user.sub // id stocked into the token (cf middleware auth)
                    }
                }
            );
            res.json(foundUser);
        } catch (err) {
            return res.status(400).json({error : `${err.message}`});
        }
    },

    /**
     * Update details of one user
     * @param {object} req HTTP request to Express app - NOT USED
     * @param {object} res HTTP response from Express app
     * @return {object} Response with JSON 
    */
    async updateUser(req,res){
        let messageSuccess = '';
        try {
            
            // Get user
            const userId = parseInt(req.user.sub); // id stocked into the token (cf middleware auth)
            let user = await User.findByPk(userId);
            if (!user) return res.status(404).json("Utilisateur introuvable");
                        
            // Get attributes of the body of the HTTP request to update the user
            const {email, password, update} = req.body;

            // Old email and password required to update user details
            assert.ok(email && password , 'Vous devez renseigner votre email et votre mot de passe actuels');

            // Check if user password is correct (old password)
            const validPassword = await user.checkPassword(password); // checkPassword is a method of the User model 

            // Test if the couple (email and password) of the user are valids. 
            assert.ok(user.email === email &&  validPassword, 'Ancien mot de passe et/ou email invalide');

            // New email ?
            if (update?.email) {
                // Check if new email is new
                assert.ok(email !== update.email, `Votre nouvel email est identique à votre ancien email.`);

                // Check if new email is valid
                // assert.ok(validator.validate(update.email), `${update.email} n'est pas un email valide.`); 

                // Check if another user has this email
                const userFound = await User.findOne({
                    attributes: ['email'],
                    where : {
                        email: update.email
                    }
                });
                
                assert.ok(!userFound, `${update.email} est déjà utilisé`); 

                // If all is ok, change the email of the user
                user.email = update.email; // Update the email
                messageSuccess += `Nouvel email : ${user.email}.`
            }


            // New password ? 
            if (update?.password) {
                // Check if the confirm password is the same
                assert.ok(update.password === update.confirmPassword, `Le nouveau mot de passe et sa confirmation ne sont pas identiques.`); 
            /*
                // Check if the user change his password
                assert.ok(update.password !== password, `Le nouveau mot de passe doit être différent de l'ancien.`); 

                // Check is the format of the password is OK
                assert.ok(schema.validate(update.password), `Le mot de passe ne remplit pas les critères de sécurité.`);

            
                // If all is ok, change the password of the user
                // note : password is hashed with bcrypt in the User model
                user.password = update.password; // Update the password
                await user.save();
            */
                messageSuccess += `Nouveau mot de passe.`;
            }

            /*
            // New firstname ? 
            if (update?.firstname) {
                user.firstname = update.firstname; // Update the firstname
                await user.save();
                messageSuccess += `Nouveau prénom : ${user.firstname}.`;
            }

            // New lastname ?
            if (update.lastname) {
                user.lastname = update.lastname; // Update the lastname
                await user.save();
                messageSuccess += `Nouveau nom : ${user.lastname}. `
            }
            */
            const result = await user.update(req.body.update);
            messageSuccess += "Compte utilisateur mis à jour"

            res.json({
                msg : messageSuccess,
                user: {
                    firstname: user.firstname,
                    lastname: user.lastname,
                    email: user.email
                }
            });    


        } catch (error) {
            res.json({
                error : error.message
            });
        }  
    },

    /**
     * Delete one user
     * @param {object} req HTTP request to Express app - NOT USED
     * @param {object} res HTTP response from Express app
     * @return {object} Response with JSON 
     */
    async deleteUser(req,res){
        const userId = parseInt(req.user.sub);

        await User.destroy({
            where: {
                id: userId
            }
        });
        res.json("User Deleted");
    },

    /**
     * Get all posts of one user     
     * @param {object} req HTTP request to Express app - NOT USED
     * @param {object} res HTTP response from Express app
     * @return {object} Response with JSON 
    */
    async getAlluserPosts(req,res){
        const userId = parseInt(req.user.sub);
        const userPosts = await User.findByPk(userId, {
            attributes: ['id','firstname','lastname'],
            include: [
                {
                    association: 'posts',
                    include: [
                        {
                            association: 'introduction',
                            attributes: ['id','content']
                        },
                        {
                            association: 'body',
                            attributes: ['id','content']
                        },
                        {
                            association: 'conclusion',
                            attributes: ['id','content']
                        },
                    ],
                    attributes: ['id','updatedAt'],
                    through: {
                        attributes: [] // To don't return the through table attributes
                    },
                },
        ] 
        });
        res.json(userPosts);
    },

    /** Add post to favorites
     * @param {object} req HTTP request to Express app - NOT USED
     * @param {object} res HTTP response from Express app
     * @return {object} Response with JSON 
    */
    async addPost(req,res){
        try{
            console.log(req.body);
            // Get user
            const userId = parseInt(req.user.sub);
            const user = await User.findByPk(userId);
            if (!user) return res.status(404).json("Utilisateur introuvable");

            // Post
            let postToAdd, created = false, message = '' ;
            const { postId } = req.body;
            console.log(postId);
            if (postId) // If we want to add a post of the BDD to a user
            {
                postToAdd = await Post.findByPk(req.body.postId); // We find the post in the BDD
                if (!postToAdd) return res.status(404).json("Post introuvable");
            } else { // Add a post generated to a user
                const { introductionId, bodyId, conclusionId } = req.body;
                [postToAdd, created] = await Post.findOrCreate({ // We find or create a post from its introduction, body and conclusion id
                where: { 
                    introduction_id : introductionId,
                    body_id : bodyId,
                    conclusion_id : conclusionId
                    },
                });
                // If we create the post, add a message
                if (created) message += `Création du post ${postToAdd.id} [i:${postToAdd.introduction_id},b:${postToAdd.body_id},c:${postToAdd.conclusion_id}].`;
            }    

            // Add the association between the post and the user
            const addResult = await user.addPost(postToAdd);

            if (addResult) res.status(201).json(`${message} Ajout du post ${postToAdd.id} en favoris`); 
            else res.json(`L'utilisateur a déjà enregistré le post ${postToAdd.id}. Ajout impossible`);
        } catch (error) {
            res.json(error);
        }
    },

    /**
     * Delete one post of favorites
     * @param {object} req HTTP request to Express app - NOT USED
     * @param {object} res HTTP response from Express app
     * @return {object} Response with JSON 
     */
        async deletePost(req,res){
            try{
                // Get user
                const userId = parseInt(req.user.sub);
                const user = await User.findByPk(userId);
                if (!user) return res.status(404).json("Utilisateur introuvable");
                
                // Get post
                const postToDelete = await Post.findByPk(req.params.postId);
                if (!postToDelete) return res.status(404).json("Post introuvable");

                // Delete the association between the post and the user
                const deleteResult = await user.removePost(postToDelete);

                if (deleteResult) res.json(`Suppression post ${req.params.postId} OK`); 
                else res.json("L'utilisateur n'a pas enregisré ce post. Suppression impossible"); // If the association between the post and the user doesn't exist
            } catch (error) {
                res.json(error);
            }
        }
}