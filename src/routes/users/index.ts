import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import { idParamSchema } from '../../utils/reusedSchemas';
import {
  createUserBodySchema,
  changeUserBodySchema,
  subscribeBodySchema,
} from './schemas';
import type { UserEntity } from '../../utils/DB/entities/DBUsers';
import { ERRORS } from '../../utils/constants';

const plugin: FastifyPluginAsyncJsonSchemaToTs = async (
  fastify
): Promise<void> => {
  fastify.get('/', async function (request, reply): Promise<UserEntity[]> {
    return await fastify.db.users.findMany();
  });

  fastify.get(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<UserEntity | Error> {
      const user = await fastify.db.users.findOne({
        key: 'id',
        equals: request.params.id,
      });
      if (!user) {
        return fastify.httpErrors.notFound(ERRORS.USER_NOT_FOUND);
      }
      return user;
    }
  );

  fastify.post(
    '/',
    {
      schema: {
        body: createUserBodySchema,
      },
    },
    async function (request, reply): Promise<UserEntity | Error> {
      return await fastify.db.users.create(request.body);
    }
  );

  fastify.delete(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<UserEntity | Error> {
      const user = await fastify.db.users.findOne({
        key: 'id',
        equals: request.params.id,
      });
      if (!user) {
        return fastify.httpErrors.badRequest(ERRORS.USER_NOT_FOUND);
      }
      const followers = await fastify.db.users.findMany({
        key: 'subscribedToUserIds',
        inArray: request.params.id,
      });
      followers.map(async (follower) => {
        const updatedSubscriptions = follower.subscribedToUserIds.filter(
          (id) => id !== request.params.id
        );
        await fastify.db.users.change(follower.id, {
          subscribedToUserIds: updatedSubscriptions,
        });
      });
      return await fastify.db.users.delete(request.params.id);
    }
  );

  fastify.post(
    '/:id/subscribeTo',
    {
      schema: {
        body: subscribeBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<UserEntity | Error> {
      const followedUser = await fastify.db.users.findOne({
        key: 'id',
        equals: request.params.id,
      });
      const follower = await fastify.db.users.findOne({
        key: 'id',
        equals: request.body.userId,
      });
      if (!followedUser || !follower) {
        return fastify.httpErrors.badRequest(ERRORS.USER_NOT_FOUND);
      }
      if (!follower.subscribedToUserIds.includes(request.params.id)) {
        follower.subscribedToUserIds.push(request.params.id);
        await fastify.db.users.change(follower.id, {
          subscribedToUserIds: follower.subscribedToUserIds,
        });
      } else {
        return fastify.httpErrors.conflict(ERRORS.USER_ALREADY_SUBSCRIBED);
      }
      const updatedUserWhoSubscribe = await fastify.db.users.findOne({
        key: 'id',
        equals: request.body.userId,
      });
      if (!updatedUserWhoSubscribe) {
        return fastify.httpErrors.notFound(ERRORS.USER_NOT_FOUND);
      }
      return updatedUserWhoSubscribe;
    }
  );

  fastify.post(
    '/:id/unsubscribeFrom',
    {
      schema: {
        body: subscribeBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<UserEntity | Error> {
      const follower = await fastify.db.users.findOne({
        key: 'id',
        equals: request.body.userId,
      });
      if (!follower) {
        return fastify.httpErrors.notFound(ERRORS.USER_NOT_FOUND);
      }
      const followedUser = await fastify.db.users.findOne({
        key: 'id',
        equals: request.params.id,
      });
      if (!followedUser) {
        return fastify.httpErrors.notFound(ERRORS.USER_NOT_FOUND);
      }
      if (!follower.subscribedToUserIds.includes(request.params.id)) {
        return fastify.httpErrors.badRequest(ERRORS.USER_NOT_SUBSCRIBED);
      }
      const newSubscribedToUserIdsArray = follower.subscribedToUserIds.filter(
        (id) => id !== request.params.id
      );
      const updatedFollower = await fastify.db.users.change(
        request.body.userId,
        { subscribedToUserIds: newSubscribedToUserIdsArray }
      );
      if (!updatedFollower) {
        return fastify.httpErrors.notFound(ERRORS.USER_NOT_FOUND);
      }
      const userFromWhomUnSubscribed = await fastify.db.users.findOne({
        key: 'id',
        equals: request.body.userId,
      });
      if (!userFromWhomUnSubscribed) {
        return fastify.httpErrors.notFound(ERRORS.USER_NOT_FOUND);
      }
      return updatedFollower;
    }
  );

  fastify.patch(
    '/:id',
    {
      schema: {
        body: changeUserBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<UserEntity | Error> {
      const user = await fastify.db.users.findOne({
        key: 'id',
        equals: request.params.id,
      });
      if (!user) {
        return fastify.httpErrors.badRequest(ERRORS.USER_NOT_FOUND);
      }
      return await fastify.db.users.change(request.params.id, request.body);
    }
  );
};

export default plugin;
