const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();

app.use(cors());
app.use(express.json());

const users = [];

function checksExistsUserAccount (request, response, next) {
  const { username } = request.headers
  const user = users.find(user => user.username === username);

  if (!user) {
    return response.status(400).json({ error: 'User not found' })
  }

  request.user = user
  return next()
}

function getTodoById (id, user) {
  return user.todos.find(todo => todo.id === id);
}

function getTodoIndexById (id, user) {
  return user.todos.findIndex(todo => todo.id === id)
}

app.post('/users', (request, response) => {
  const { name, username } = request.body

  const userAlreadyExists = users.some(user => user.username === username)
  if (userAlreadyExists) {
    return response.status(400).json({ error: 'User already exists' })
  }

  var user = {
    id: uuidv4(),
    name,
    username,
    todos: []
  }
  users.push(user)

  return response.status(201).send(user)
});

app.get('/todos', checksExistsUserAccount, (request, response) => {
  const { user } = request
  return response.json(user.todos)
});

app.post('/todos', checksExistsUserAccount, (request, response) => {
  const { title, deadline } = request.body
  const { user } = request

  const todo = {
    id: uuidv4(),
    title,
    deadline: new Date(deadline),
    done: false,
    created_at: new Date()
  };
  user.todos.push(todo)
  return response.status(201).json(todo)
});

app.put('/todos/:id', checksExistsUserAccount, (request, response) => {
  const { id } = request.params
  const { title, deadline } = request.body
  const { user } = request

  if (!title || !deadline) {
    return response.status(400).json({ error: 'Missing data' })
  }

  const todoExists = user.todos.some(t => t.id === id)
  if (!todoExists) {
    return response.status(404).json({ error: 'Todo not found' })
  }

  const todo = getTodoById(id, user)
  todo.title = title
  todo.deadline = deadline

  const todoIndex = getTodoIndexById(id, user)
  user.todos[todoIndex] = todo

  return response.status(200).json(todo)
});

app.patch('/todos/:id/done', checksExistsUserAccount, (request, response) => {
  const { id } = request.params
  const { user } = request

  const todo = getTodoById(id, user)

  if (!todo) {
    return response.status(404).json({ error: 'Todo not found' })
  }

  todo.done = true

  const todoIndex = getTodoIndexById(id, user)
  user.todos[todoIndex] = todo

  return response.status(200).json(todo)
});

app.delete('/todos/:id', checksExistsUserAccount, (request, response) => {
  const { id } = request.params
  const { user } = request

  const todoIndex = getTodoIndexById(id, user)

  if (todoIndex < 0) {
    return response.status(404).json({ error: 'Todo not found' })
  }

  user.todos.splice(todoIndex, 1)
  return response.status(204).send(user.todos)
});

module.exports = app;