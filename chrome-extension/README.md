Run npm run build to see changes on chrome developer console.

React project bundled into extension. 

Notes: 
1. change api call rate in background.js for testing 
2. ask for testing privileges for an email address
3. depending on how the extension is on startup, we may need a small db to store spreadsheet info and user preferences
    a. definitely, in case it goes off for a long period of time. keep last update in db. 
4. create external website for payment and initialization (a dashboard such as simplify) 
5. store keys and shit in env file and another place. 
6. look into stripe for payment 
7. hire a css merchant 
8. think of all scenarios error handling
    a. no wifi
    b. outages 
9. aws protection against cyberthreats and make sure all sensitive info is masked within application

Control flow: 