const http = require('http');
const Koa = require('koa');
const Router = require('koa-router');
const koaBody = require('koa-body');
const WS = require('ws');

const app = new Koa();
const router = new Router();
const users = [];

app.use(koaBody({
  urlencoded: true,    
  multipart: true,
  json: true,
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


router.post('/nicknames', async (ctx, next) => {
  const {nickname} = ctx.request.body;
  if (users.some(sub => sub.nickname === nickname)) {
    ctx.response.status = 400;
    ctx.response.body = { status: "Псевдоним уже зарегистрирован" };
    return;
  };
  users.push({ nickname });
  console.log(users);
  ctx.response.body = { status: "Псевдоним зарегистрирован!" };
  next();
});

router.get('/users', async (ctx, next) => {
  ctx.request.body = users;
  ctx.response.status = 200;
  console.log()
  next();
});

app.use(router.routes()).use(router.allowedMethods());


const port = process.env.PORT || 1000;
const server = http.createServer(app.callback());


const wsServer = new WS.Server({
  server
});

// const chat = [];
// wsServer.on('connection', (ws) => {
//   ws.on('message', (message) => {
//     console.log(message)
// //     chat.push(message);
//     // console.log(chat)
// //     // const eventData = JSON.stringify({ chat: [message] });
// //     // Array.from(wsServer.clients)
// //     // .filter(client => client.readyState === WS.OPEN)
// //     // .forEach(client => client.send(eventData));
// //     if (body.type === 'authorization') {
// //       if (users.includes(body.name)) {
// //           body.name = false;
// //           ws.send(JSON.stringify(body));
// //       } else {
// //           users.push(body.name);
// //           ws.send(msg);
// //           wsServer.clients.forEach(client => {
// //               if (client.readyState === WS.OPEN) {
// //                   client.send(JSON.stringify(users));
// //               }
// //           })
// //       }
// //   }

// //   if (body.type === 'message') {
// //       wsServer.clients.forEach(client => {
// //           if (client.readyState === WS.OPEN) {
// //               client.send(JSON.stringify(body));
// //           }
// //       })
// //   }

// //   if (body.type === 'disconnect') {
// //       const index = users.indexOf(body.name);
// //       users.splice(index, 1);
// //       wsServer.clients.forEach(client => {
// //           if (client.readyState === WS.OPEN) {
// //               client.send(JSON.stringify(users));
// //           }
// //       })
//   // }
  // });
//   // ws.send(JSON.stringify({ chat }));
// });


server.listen(port);