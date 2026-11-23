import jwt from "jsonwebtoken";

// // req has user property by default.
function authenticate(req, res, next){

    const authHeader = req.headers.authorization;

    // If the authHeader does not comtain "Bearer " then it will return undefined so then authHeader
    // accress an undefined value will result into an error. To avoide this you can use optional 
    // chaining.
    if(!authHeader?.startsWith("Bearer ")){
        return res.status(401).json({"error": "No token provided."});
    }

    /* ["Bearer", "abc123xyz"]
    The [1] retrieves "abc123xyz".
    */
    const token = authHeader.split(" ")[1];

    /* The problem an if statement doesn't work is that jwt.verify() does not normally return false 
    when a token is invalid. Instead, it throws an error.
    */
    try{
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    }
    catch(err){
        return res.status(401).json({"error": "Invalid or expired token."});
    }
}

export {authenticate};
