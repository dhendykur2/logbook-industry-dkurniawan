const controller = require('../controllers/index');

/**
 * routes
 * @param {*} fastify
 * @param {*} options
 */
async function routes(fastify, options) {
  // GET ROUTES
  const optProfile = {
    schema: {
      response: {
        200: {
          type: 'object',
          properties: {
            img: { type: 'string' },
            nim: { type: 'string' },
            name: { type: 'string' },
          },
        },
      },
    },
  };
  fastify.get('/profile', optProfile, controller.profile);

  // POST ROUTES
  const optLogin = {
    schema: {
      body: {
        username: { type: String },
        password: { type: String },
      },
    },
  };
  fastify.post('/login', optLogin, controller.login);


  const optInsert = {
    schema: {
      body: {
        clock_in: { type: String },
        clock_out: { type: String },
        activity: { type: String },
        descriptions: { type: String },
      },
    },
  };
  fastify.post('/insert', optInsert, controller.insert);
}

module.exports = routes;
