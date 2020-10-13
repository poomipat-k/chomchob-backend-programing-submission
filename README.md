# Chomchob backend programming submission
## Tools
 - Backend Node.js (Express.js)
 - Database MySQL hosted on remotemysql.com
 - javascript MySQL driver -> npm mysql2

## How to run this api
1. git clone
2. npm install
3. npm run dev
4. Go to localhost:5000

## APIs usage
### Sign up 
 - Method: POST
 - Route: /signup
 - Request body with JSON format { "username" : "usernameA", "password" : "qwer"} (admin signup must use the username "admin" only)

### Login
 - Method: POST
 - Route: /login
 - Request body with JSON format: { "username" : "usernameA", "password" : "qwer"}

### Admin can increase and decrease user cryptocurrency balance
 - Method: PATCH
 - Route: /api/v1/admin/crypto/:targetUserId
 - Authorization header: Bear ${token}  // token received from /login only admin account can access the api
 - Request body with JSON format: { "symbol" : "AAA", "balance" : 1000 }

### Admin can see all total balance of all cryptocurrency
 - Method: GET
 - Route: /api/v1/admin/crypto
 - Authorization header: Bear ${token}  // token received from /login only admin account can access the api

### Admin can add other cryptocurrency such XRP, EOS, XLM to wallet
 - Method: POST
 - Route: /api/v1/admin/crypto
 - Authorization header: Bear ${token}  // token received from /login only admin account can access the api
 - Request body with JSON format: { "symbol" : "AAA", "price" : 8 }

### Admin can manage exchange rate between cryptocurrency
 - Method: PATCH
 - Route: /api/v1/admin/crypto
 - Authorization header: Bear ${token}  // token received from /login only admin account can access the api
 - Request body with JSON format: { "symbol" : "AAA", "price" : 4 }

### User can transfer cryptocurrency to other
 - Method: Patch
 - Route: /api/v1/users/transfer/:targetUserId
 - Authorization header: Bear ${token}  // token received from /login
 - Request body with JSON format: { "symbolFrom" : "AAA", "amountFrom" : 100 }

### User can transfer cryptocurrency to other with difference currency such ETH to BTC with exchange rate
 - Method: Patch
 - Route: /api/v1/users/transfer/:targetUserId
 - Authorization header: Bear ${token}  // token received from /login
 - Request body with JSON format: { "symbolFrom" : "AAA", "symbolTo" : "BBB", "amountFrom" : 100 }


## Database tables relationships
![ERD](https://crafterbucket.s3-ap-southeast-1.amazonaws.com/ERD_ChomChob_Programming.png)