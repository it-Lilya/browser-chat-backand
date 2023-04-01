const http = require('http');
const Koa = require('koa');

const koaBody = require('koa-body');

const WS = require('ws');

const app = new Koa();

app.use(koaBody({
  urlencoded: true,
}));

app.use(async (ctx, next) => {
  const origin = ctx.request.get('Origin');
  if (!origin) {
    return await next();
  }

  const headers = { 'Access-Control-Allow-Origin': '*', };

  if (ctx.request.method !== 'OPTIONS') {
    ctx.response.set({ ...headers });
    try {
      return await next();
    } catch (e) {
      e.headers = { ...e.headers, ...headers };
      throw e;
    }
  }

  if (ctx.request.get('Access-Control-Request-Method')) {
    ctx.response.set({
      ...headers,
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH',
    });

    if (ctx.request.get('Access-Control-Request-Headers')) {
      ctx.response.set('Access-Control-Allow-Headers', ctx.request.get('Access-Control-Request-Headers'));
    }

    ctx.response.status = 204;
  }
});


const Router = require('koa-router');

const router = new Router();

const users = [];
let user;

router.post('/nicknames', (ctx) => {
    const { nickname } = ctx.request.body;
  
    ctx.response.set('Access-Control-Allow-Origin', '*');
    if (users.some(sub => sub.nickname === nickname)) {
      ctx.response.status = 400;
      
      return ctx.response.body = { status: 'Псевдоним уже существует!'}
    }

    users.push({ nickname });
    ctx.response.body = { status: "OK" };
});

router.get('/nicknames-list', async (ctx) => {
  ctx.response.body = users;
});


app.use(router.routes()).use(router.allowedMethods());


const port = process.env.PORT || 3000;
const server = http.createServer(app.callback());

const wsServer = new WS.Server({
  server
});

const chat = [];

wsServer.on('connection', (ws) => {
  ws.on('message', (message) => {
    user = JSON.parse(message);

    chat.push(message);
    const eventData = JSON.stringify({ chat: [message] });

    Array.from(wsServer.clients)
      .filter(client => client.readyState === WS.OPEN)
      .forEach(client => client.send(eventData));
  });


  ws.send(JSON.stringify({ chat }));
});



server.listen(port);