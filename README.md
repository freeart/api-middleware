# API-middleware
```sh
npm i
```
```sh
npm test
```
or
```sh
npm run test:unit
npm run test:integration
npm run test:e2e
```
```sh
npm start
```
username: any email from clients list   
password: s3cr3t   

# issues
- The Swagger file uses the wrong syntax of the path param declaration.  
**/policies/:id** should be **/policies/{id}**. 
curl -X GET "http://localhost:3000/api/v1/policies/:id" -H "accept: application/json". 
It is what actually sends swagger to the server when we put "5d6190ed-3c74-4673-ba70-f57d8fbd4b8d" in the text field.  
The same with **/clients/:id** and **/clients/:id/policies**

- Cache-control.  
The headers **If-None-Match** and **If-Modified-Since** don't work right - maybe I'm doing something wrong, I'm not so sure.

- Pagination.  
Description for **/policies** says: _"Get the list of policies' client paginated and limited to 10 elements by default."_.  
There is only one query param **limit** in the swagger file. There is no **page** or **offset** to manage the pagination process.  
Maybe I don't understand something, but I put the "page" query param in API.

- Clients with "user" roles have no policies.  
Only admins have. I can't cover this part of e2e to test **/policies**, **/policies/:id** and **/clients/:id/policies** properly for client with role="user"

- Http statues in swagger.  
    - All API calls should describe 500 status for server error cases.  
    - All API calls with path/query/body params should describe 400 status to return what wrong with the input data [?limit=AAA] for example.  
    It helps to find issues on the frontend side.

- There is no description for the case when integration service failed?  
 What behaviour should be? Have I remove local data to invalidate cache or return old data. 