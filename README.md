# Chomchob backend programming submission
## Tools
 - Backend Node.js (Express.js)
 - Database MySQL host on remotemysql.com
 - javascript MySQL driver -> mysql2

## How to run this api
1. git clone
2. npm install
3. npm run dev
4. Go to localhost:5000

## APIs usage
### Sign up 
 - /signup  | JSON format request body { "username" : "usernameA", "password" : "qwer"} (admin signup must use the username "admin" only)

### Login
 - /login | JSON format request body { "username" : "usernameA", "password" : "qwer"}


## Database tables relationships
![ERD](https://crafterbucket.s3-ap-southeast-1.amazonaws.com/ERD_ChomChob_Programming.png)