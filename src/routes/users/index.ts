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
      return user ? user : fastify.httpErrors.notFound(ERRORS.USER_NOT_FOUND);
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
        const subscriptions = follower.subscribedToUserIds.filter(
          (id) => id !== request.params.id
        );
        await fastify.db.users.change(follower.id, {
          subscribedToUserIds: subscriptions,
        });
      });
      const userPosts = await fastify.db.posts.findMany({
        key: 'userId',
        equals: request.params.id,
      });
      userPosts.map(async (post) => {
        await fastify.db.posts.delete(post.id);
      });
      const userProfiles = await fastify.db.profiles.findMany({
        key: 'userId',
        equals: request.params.id,
      });
      userProfiles.map(async (profile) => {
        await fastify.db.profiles.delete(profile.id);
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
      const {
        params: { id: followedUserId },
        body: { userId: followerId },
      } = request;
      const followedUser = await fastify.db.users.findOne({
        key: 'id',
        equals: followedUserId,
      });
      const follower = await fastify.db.users.findOne({
        key: 'id',
        equals: followerId,
      });
      if (!followedUser || !follower) {
        return fastify.httpErrors.badRequest(ERRORS.USER_NOT_FOUND);
      }
      if (!follower.subscribedToUserIds.includes(followedUserId)) {
        const subscriptions = [...follower.subscribedToUserIds, followedUserId];
        await fastify.db.users.change(follower.id, {
          subscribedToUserIds: subscriptions,
        });
      } else {
        return fastify.httpErrors.conflict(ERRORS.USER_ALREADY_SUBSCRIBED);
      }
      return follower;
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
      const {
        params: { id: followedUserId },
        body: { userId: followerId },
      } = request;
      const follower = await fastify.db.users.findOne({
        key: 'id',
        equals: followerId,
      });
      const followedUser = await fastify.db.users.findOne({
        key: 'id',
        equals: followedUserId,
      });
      if (!follower || !followedUser) {
        return fastify.httpErrors.notFound(ERRORS.USER_NOT_FOUND);
      }
      if (!follower.subscribedToUserIds.includes(followedUserId)) {
        return fastify.httpErrors.badRequest(ERRORS.USER_NOT_SUBSCRIBED);
      }
      const newSubscriptions = follower.subscribedToUserIds.filter(
        (id) => id !== followedUserId
      );
      const updatedFollower = await fastify.db.users.change(followerId, {
        subscribedToUserIds: newSubscriptions,
      });
      if (!updatedFollower) {
        return fastify.httpErrors.notFound(ERRORS.USER_NOT_FOUND);
      }
      const updatedFollowedUser = await fastify.db.users.findOne({
        key: 'id',
        equals: followedUserId,
      });
      if (!updatedFollowedUser) {
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
