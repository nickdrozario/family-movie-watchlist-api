import express from "express";
import helmet from "helmet";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import {authenticate} from "./middleware/authenticate.js";
import {findByUsername} from "./utils/db.js";

/*
import users from "./data/users.json" with {type: "json"};

with { type: "json" } is an Import Attribute (part of modern JavaScript / ECMAScript Modules) that 
explicitly tells the JavaScript runtime (such as Node.js or a browser) to load and parse the imported 
file strictly as JSON data, rather than executing it as JavaScript code.
*/

import watchlistRoutes from "./routes/watchlist.js";

const PORT = process.env.PORT || 3000;
const app = express();

app.use(helmet());
app.use(express.json());

// Do not remove
app.get("/", (req, res) => {
  res.send("Family Movie Watchlist API");
});

// Do not remove
app.post("/api/auth/login", async (req, res) => {
  /* If req.body is undefined, destructuring null throws a TypeError: Cannot destructure property 
  'username' of '(req.body || null)' as it is null. Use req.body || {} instead.
  */
  const {username, password} = req.body || {};

  if(!username || !password){
    return res.status(400).json({error: "Username and password are required."});
  }

  const user = findByUsername(username);
  if(!user){
    return res.status(401).json({error: "Wrong username and password."});
  }

  /* You comparing the password the user is trying to login with to the passowrd stored in the server
  as passowrdHash.  
  {
    "id": 1,
    "name": "David Miller",
    "username": "dad_miller",
    "_password": "parent456",
    "role": "parent",
    "passwordHash": "$2a$10$V4nCDj9z1mpYmhilx43xy.Wl9whaKMmSMSpL4qXmrS.Z73JSq7vRe"
  }
  */
  const isValidPassword = await bcrypt.compare(password, user.passwordHash);
  if(!isValidPassword){
    return res.status(401).json({error: "Invalid credentials."});
  }
  const token = jwt.sign({
    id: user.id, username: user.username, role: user.role}, 
    process.env.JWT_SECRET, 
    {expiresIn: "1d"}
  );

  return res.status(200).json({token});

});

/* When the user goes to this url path it will run the authenticate() function, and this function will 
call next() if the conditions are right. The next() method calls the next middleware which is 
watchlistRoutes. If the conditions are wrong and the user get 401 status code, then the next()
method is not called so it does not call watchlistRoutes middleware function.
*/
app.use("/api/watchlist", authenticate, watchlistRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}...`);
});
