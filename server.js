'use strict';
require('dotenv').config();
const fastify = require('fastify')({ logger: true });
fastify.register(require('fastify-cors'), { origin: true });
// fastify.register(require('fastify-env'));
fastify.register(require('fastify-formbody'));

fastify.get('/', async () => {
  return { message: 'goods' };
});
fastify.register(require('./routes'));

// Run the server!
const start = async () => {
  try {
    await fastify.listen(process.env.NODE_PORT);
    fastify.log.info(`server listening on ${fastify.server.address().port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
