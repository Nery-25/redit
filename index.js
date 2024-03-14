const express = require("express");
const { MongoClient, ObjectID } = require('mongodb');
const Joi = require('joi');
const jwt = require('jsonwebtoken');

const app = express();
const dbName = "Cluster0";

// Middleware de logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

app.use(express.json());

// Middleware de autenticação
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.sendStatus(401);

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

// Endpoint para criar um novo subreddit
app.post('/subreddits', async (req, res) => {
  const subredditData = req.body;
  console.log('Dados do subreddit:', subredditData);

  try {
    // Lógica para guardar dados do subreddit no banco de dados
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection('subreddits');
    const result = await collection.insertOne(subredditData);
    res.status(201).json({ message: 'Subreddit criado com sucesso', subreddit: result.ops[0] });
  } catch (error) {
    console.error('Erro ao criar subreddit:', error);
    res.status(500).json({ mensagem: 'Erro ao criar subreddit' });
  } finally {
    client.close();
  }
});

// Endpoint para listar os posts de um subreddit
app.get('/subreddits/:subredditId/posts', async (req, res) => {
  const subredditId = req.params.subredditId;

  try {
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection('posts');
    const posts = await collection.find({ subredditId: subredditId }).toArray();
    res.status(200).json({ posts });
  } catch (error) {
    console.error('Erro ao buscar posts:', error);
    res.status(500).json({ mensagem: 'Erro ao buscar posts' });
  } finally {
    client.close();
  }
});

// Endpoint para obter os comentários de um post
app.get('/posts/:postId/comments', async (req, res) => {
  const postId = req.params.postId;

  try {
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection('comments');
    const comments = await collection.find({ postId: postId }).toArray();
    res.status(200).json({ comments });
  } catch (error) {
    console.error('Erro ao buscar comentários:', error);
    res.status(500).json({ mensagem: 'Erro ao buscar comentários' });
  } finally {
    client.close();
  }
});

// Endpoint para criar um post em uma comunidade
app.post("/subreddits/:subredditId/posts", authenticateToken, async (req, res) => {
  const subredditId = req.params.subredditId;
  const postData = req.body;
  console.log(`Criar novo post no subreddit ${subredditId}:`, postData);

  try {
    // Lógica para criar um novo post em um subreddit no banco de dados
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection('posts');
    const result = await collection.insertOne({ ...postData, subredditId });
    res.status(201).json({ post: { ...postData, _id: result.insertedId } });
  } catch (error) {
    console.error('Erro ao criar post:', error);
    res.status(500).json({ message: 'Erro ao criar post' });
  } finally {
    client.close();
  }
});

// Endpoint para editar um post
app.put('/posts/:postId', async (req, res) => {
  const postId = req.params.postId;
  const updatedPostData = req.body;

  // Validar os dados atualizados do post usando o schema Joi (se necessário...)

  try {
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection('posts');
    const result = await collection.updateOne({ _id: new ObjectID(postId) }, { $set: updatedPostData });
    if (result.modifiedCount === 1) {
      res.status(200).json({ mensagem: 'Post atualizado com sucesso', post: updatedPostData });
    } else {
      res.status(404).json({ mensagem: 'Post não encontrado' });
    }
  } catch (error) {
    console.error('Erro ao atualizar post:', error);
    res.status(500).json({ mensagem: 'Erro ao atualizar post' });
  } finally {
    client.close();
  }
});

// Endpoint para eliminar um post
app.delete('/posts/:postId', async (req, res) => {
  const postId = req.params.postId;

  try {
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection('posts');
    const result = await collection.deleteOne({ _id: new ObjectID(postId) });
    if (result.deletedCount === 1) {
      res.status(200).json({ mensagem: 'Post eliminado com sucesso' });
    } else {
      res.status(404).json({ mensagem: 'Post não encontrado' });
    }
  } catch (error) {
    console.error('Erro ao eliminar post:', error);
    res.status(500).json({ mensagem: 'Erro ao eliminar post' });
  } finally {
    client.close();
  }
});

// Endpoint para obter os detalhes de uma poll (por ID)
app.get('/polls/:pollId', async (req, res) => {
  const pollId = req.params.pollId;

  try {
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection('polls');
    const poll = await collection.findOne({ _id: new ObjectID(pollId) });
    res.status(200).json({ poll });
  } catch (error) {
    console.error('Erro ao buscar detalhes da poll:', error);
    res.status(500).json({ mensagem: 'Erro ao buscar detalhes da poll' });
  } finally {
    client.close();
  }
});

// Endpoint para criar uma poll
app.post('/polls', authenticateToken, async (req, res) => {
  const pollData = req.body;
  console.log('Dados da poll:', pollData);

  try {
    // Lógica para guardar dados da poll no banco de dados
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection('polls');
    const result = await collection.insertOne(pollData);
    res.status(201).json({ message: 'Poll criada com sucesso', poll: result.ops[0] });
  } catch (error) {
    console.error('Erro ao criar poll:', error);
    res.status(500).json({ mensagem: 'Erro ao criar poll' });
  } finally {
    client.close();
  }
});

// Endpoint para votar numa opção de uma poll
app.post('/polls/:pollId/vote', authenticateToken, async (req, res) => {
  const pollId = req.params.pollId;
  const option = req.body.option;

  try {
    // Lógica para adicionar voto à opção da poll no banco de dados
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection('polls');
    const result = await collection.updateOne({ _id: new ObjectID(pollId), "options.text": option }, { $inc: { "options.$.votes": 1 } });
    
    if (result.modifiedCount === 1) {
      res.status(200).json({ message: 'Voto registrado com sucesso' });
    } else {
      res.status(404).json({ message: 'Opção de voto não encontrada' });
    }
  } catch (error) {
    console.error('Erro ao votar na poll:', error);
    res.status(500).json({ message: 'Erro ao votar na poll' });
  } finally {
    client.close();
  }
});

// Middleware para bloquear conta após 3 falhas de login
const loginAttempts = new Map();
const MAX_LOGIN_ATTEMPTS = 3;

app.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (loginAttempts.has(username) && loginAttempts.get(username) >= MAX_LOGIN_ATTEMPTS) {
    return res.status(401).json({ message: 'Conta bloqueada. Tente novamente mais tarde.' });
  }

  // Lógica para verificar credenciais e gerar token JWT
  // ...

  // Simulação de autenticação bem-sucedida
  const token = jwt.sign({ username }, process.env.ACCESS_TOKEN_SECRET);
  res.json({ token });

  // Simulação de autenticação falha
  // res.status(401).json({ message: 'Credenciais inválidas' });
});

async function start(app) {
  try {
    await app.listen(process.env.PORT || 3000);
    console.log("Servidor está rodando");
  } catch (error) {
    console.error("Erro ao iniciar servidor:", error);
  }
}

start(app);
