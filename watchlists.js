import express from "express";
import {authorizeModification} from "../middleware/authorize.js"
import {findById, getWatchlist, addMovie, updateMovie, deleteMovie} from "../utils/db.js";

const router = express.Router();

router.get("/:userId", (req, res) => {

  // findById() returns an object like the one from users.json file.
  const user = findById(Number(req.params.userId));
  if(!user){
    return res.status(404).json({error: "User not found."});
  }

  const watchlist = getWatchlist(user.id);

  /* With { watchlist: `${watchlist}` }: The template literal `${watchlist}` calls .toString() on 
  watchlist first, turning an array/object (like [{ id: 1, title: "Inception" }]) into a single string 
  (such as "[object Object]" or a comma-separated string). Then res.json(...) serializes that string 
  into the JSON response ({"watchlist":"[object Object]"}) instead of a JSON array of movie objects.
  
  With { watchlist }: Express passes the actual watchlist array/object into JSON.stringify, producing 
  proper structured JSON like {"watchlist":[{"id":1,"title":"Inception"}]}.
  */
  return res.status(200).json({watchlist})
});

router.post("/:userId/movies", authorizeModification, (req, res) => {
  /* Title and genre are in req.body because the client would send a post request to the server and this 
  would be made available to the req.body by express. Furthermore, if you are reviewing code and you 
  want to know how the client should send the request to the server you can look at the addMovie() 
  function, which uses the object to create a movie. 
  For example:
  const movie = {
    id: newId,
    title: movieData.title,
    genre: movieData.genre,
    watched: false,
  };
  The above object is in the addMovie() function.
  */
  const {title, genre} = req.body || {};

  /* 
    if(req.user.role !== "parent"){
        return res.status(403).json({message: "Access denied."});
    }

  req.user has access to role by req.user.role because in route "/api/auth/login" is where you issue 
  a the token to the variable token.Once a client sends that token back in Authorization: Bearer <token> 
  by making a get request to /api/watchlist/1 or a post request to /api/watchlist/1/movies, 
  authenticate.js decodes it with jwt.verify(token, process.env.JWT_SECRET) and attaches the decoded 
  payload to req.user. So req.user.role exists only if role was included in the payload object passed to 
  jwt.sign(...) at login time.
  */
  if(!title || !genre){
    return res.status(400).json({message: "Title and genre are missing."});
  }

  /* findById() returns like { id: 1, username: "...", role: "..." }) or null.
  */
  const user = findById(Number(req.params.userId));
  if(!user){
    return res.status(404).json({message: "User not found."});
  }

  const movie = addMovie(user.id, {title, genre});
  return res.status(201).json({message: "Movie has been added to the watchlist.", movie});
});

router.put("/:userId/movies/:movieId", authorizeModification, (req, res) => {
  if(req.user.role === "parent"){
    const {title, genre} = req.body || {};

    const parsedId = Number(req.params.userId);
    const lookupId = Number.isNaN(parsedId) ? req.params.userId: parsedId;
    const user = findById(lookupId);

    if(!user){
      return res.status(404).json({message: "User not found."});
    }
    const updates = {};

    /* You do this check for both title and genre because updatedMovie() below doesn't update with a
    undefined value if either title or genre is missing. If, for example, title exist and genre is missing
    then updatedMoive() function below will add only the value that is not undefined.
    */
    if(title !== undefined){
      updates.title = title;
    }

    if(genre !== undefined){
      updates.genre = genre;
    }

    const updatedMovie = updateMovie(user.id, Number(req.params.movieId), updates);
    if(!updatedMovie){
      return res.status(404).json({message: "Movie not found."});
    }

    return res.status(200).json({message: "Movie has been updated on watchlist.", movie: updatedMovie})
  }

  const {title, genre} = req.body || {};

  const parsedId = Number(req.params.userId);
  const lookupId = Number.isNaN(parsedId) ? req.params.userId: parsedId;
  const user = findById(lookupId);

  if(!user){
    return res.status(404).json({message: "User not found."});
  }
  const updates = {};
    if(title !== undefined){
    updates.title = title;
  }

  if(genre !== undefined){
    updates.genre = genre;
  }

  const updatedMovie = updateMovie(user.id, Number(req.params.movieId), updates);
  if(!updatedMovie){
    return res.status(404).json({message: "Movie not found."});
  }

  return res.status(200).json({message: "Movie has been updated on watchlist.", movie: updatedMovie})
});

router.delete("/:userId/movies/:movieId", authorizeModification, (req, res) => {
  if(req.user.role === "parent"){
    const parsedId = Number(req.params.userId);
    const lookupId = Number.isNaN(parsedId) ? req.params.userId: parsedId;
    const user = findById(lookupId);

    if(!user){
      return res.status(404).json({message: "User not found."});
    }

    const deletedMovie = deleteMovie(user.id, Number(req.params.movieId));
    return res.status(200).json({message: "Successfully removed movie from watchlist.", movie: deletedMovie});
  }

  const parsedId = Number(req.params.userId);
  const lookupId = Number.isNaN(parsedId) ? req.params.userId: parsedId;
  const user = findById(lookupId);

  if(!user){
    return res.status(404).json({message: "User not found."});
  }

  const deletedMovie = deleteMovie(user.id, Number(req.params.movieId));
  return res.status(200).json({message: "Successfully removed movie from watchlist.", movie: deletedMovie});

});

export default router;
