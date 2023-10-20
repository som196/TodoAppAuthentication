const express = require("express");
const app = express();
app.use(express.json());
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const dbPath = path.join(__dirname, "todoApplication.db");
let db = null;

const addDays = require("date-fns/addDays");
const format = require("date-fns/format");
const isValid = require("date-fns/isValid");
const initializeDBAndServer = async () => {
  try {
    db = await open({ filename: dbPath, driver: sqlite3.Database });
    app.listen(3000, () => {
      console.log("Server is running at https://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
module.exports = app;
initializeDBAndServer();

//API1 Returns a list of all todos whose status is 'TO DO'
app.get("/todos/", async (request, response) => {
  const { search_q = "", priority, status, category } = request.query;
  let getTodos = "";
  const priorityList = ["HIGH", "MEDIUM", "LOW"];
  const statusList = ["TO DO", "IN PROGRESS", "DONE"];
  const categoryList = ["WORK", "HOME", "LEARNING"];
  if (!priorityList.includes(priority) && priority !== undefined) {
    response.status(400);
    response.send("Invalid Todo Priority");
  } else if (!statusList.includes(status) && status !== undefined) {
    response.status(400);
    response.send("Invalid Todo Status");
  } else if (!categoryList.includes(category) && category !== undefined) {
    response.status(400);
    response.send("Invalid Todo Category");
  } else {
    if (priority !== undefined && status !== undefined) {
      getTodos = `SELECT * FROM todo where priority='${priority}'
    AND status='${status}' `;
    } else if (
      priority !== undefined &&
      status == undefined &&
      category === undefined
    ) {
      getTodos = `SELECT * FROM todo where priority='${priority}';`;
    } else if (status !== undefined && priority == undefined) {
      getTodos = `SELECT * FROM todo where status='${status}'; `;
    } else if (
      priority == undefined &&
      status == undefined &&
      search_q !== ""
    ) {
      getTodos = `SELECT * FROM todo where todo LIKE '%${search_q}%'; `;
    } else if (
      category !== undefined &&
      status !== undefined &&
      priority === undefined
    ) {
      getTodos = `SELECT * FROM todo where category='${category}' AND
    status='${status}'`;
    } else if (category !== undefined && priority === undefined) {
      getTodos = `SELECT * FROM todo where category='${category}';`;
    } else if (category !== undefined && priority !== undefined) {
      getTodos = `SELECT * FROM todo where category='${category}' AND
    priority ='${priority}'`;
    } else {
      getTodos = `SELECT * FROM todo`;
    }
    const TodoArray = await db.all(getTodos);
    response.send(
      TodoArray.map((each) => ({
        id: each.id,
        todo: each.todo,
        priority: each.priority,
        status: each.status,
        category: each.category,
        dueDate: each.due_date,
      }))
    );
  }
});

//API2 Returns a specific todo based on the todo ID
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `SELECT * FROM todo WHERE id=${todoId};`;
  const each = await db.get(getTodoQuery);
  response.send({
    id: each.id,
    todo: each.todo,
    priority: each.priority,
    status: each.status,
    category: each.category,
    dueDate: each.due_date,
  });
});

//API3 Returns a list of all todos with a
//specific due date in the query parameter /agenda/?date=2021-12-12
app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  const result = isValid(new Date(date));
  if (result) {
    const formattedDate = format(new Date(date), "yyyy-MM-dd");

    const getSpecificWithDate = `SELECT * FROM todo WHERE due_date='${formattedDate}';`;
    const todoList = await db.all(getSpecificWithDate);
    response.send(
      todoList.map((each) => ({
        id: each.id,
        todo: each.todo,
        priority: each.priority,
        status: each.status,
        category: each.category,
        dueDate: each.due_date,
      }))
    );
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
});

//API3 Create a todo in the todo table
app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  const priorityList = ["HIGH", "MEDIUM", "LOW"];
  const statusList = ["TO DO", "IN PROGRESS", "DONE"];
  const categoryList = ["WORK", "HOME", "LEARNING"];
  const result = isValid(new Date(dueDate));
  if (!priorityList.includes(priority) || priority === undefined) {
    response.status(400);
    response.send("Invalid Todo Priority");
  } else if (!statusList.includes(status) || status === undefined) {
    response.status(400);
    response.send("Invalid Todo Status");
  } else if (!categoryList.includes(category) || category === undefined) {
    response.status(400);
    response.send("Invalid Todo Category");
  } else if (result === false) {
    response.status(400);
    response.send("Invalid Due Date");
  } else if (result === true) {
    const createTodoQuery = `INSERT INTO todo (id, todo, priority, status,category,due_date)
    VALUES (${id}, '${todo}', '${priority}', '${status}', '${category}','${dueDate}');`;
    await db.run(createTodoQuery);
    response.send("Todo Successfully Added");
  }
});

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const updateBody = request.body;
  const { status, priority, todo, category, dueDate } = updateBody;
  let updateTodoQuery = "";
  const priorityList = ["HIGH", "MEDIUM", "LOW"];
  const statusList = ["TO DO", "IN PROGRESS", "DONE"];
  const categoryList = ["WORK", "HOME", "LEARNING"];
  //   const result = isValid(new Date(dueDate));
  if (!priorityList.includes(priority) && priority !== undefined) {
    response.status(400);
    response.send("Invalid Todo Priority");
  } else if (!statusList.includes(status) && status !== undefined) {
    response.status(400);
    response.send("Invalid Todo Status");
  } else if (!categoryList.includes(category) && category !== undefined) {
    response.status(400);
    response.send("Invalid Todo Category");
  }
  //   } else if (result === false) {
  //     response.status(400);
  //     response.send("Invalid Due Date");
  //   }
  else {
    const result = isValid(new Date(dueDate));
    if (status !== undefined) {
      updateTodoQuery = `UPDATE todo SET status='${status}'
        WHERE id=${todoId};`;
      await db.run(updateTodoQuery);
      response.send("Status Updated");
    } else if (priority !== undefined) {
      updateTodoQuery = `UPDATE todo SET priority='${priority}'
        WHERE id=${todoId};`;
      await db.run(updateTodoQuery);
      response.send("Priority Updated");
    } else if (category !== undefined) {
      updateTodoQuery = `UPDATE todo SET category='${category}'
        WHERE id=${todoId};`;
      await db.run(updateTodoQuery);
      response.send("Category Updated");
    } else if (result === true) {
      updateTodoQuery = `UPDATE todo SET due_date='${dueDate}'
        WHERE id=${todoId};`;
      await db.run(updateTodoQuery);
      response.send("Due Date Updated");
    } else if (todo !== undefined) {
      updateTodoQuery = `UPDATE todo SET todo='${todo}'
        WHERE id=${todoId};`;
      await db.run(updateTodoQuery);
      response.send("Todo Updated");
    } else if (result === false) {
      response.status(400);
      response.send("Invalid Due Date");
    }
  }
});

//API5 Deletes a todo from the todo table based on the todo ID
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `DELETE FROM todo WHERE id=${todoId};`;
  const todo = await db.run(getTodoQuery);
  response.send("Todo Deleted");
});
