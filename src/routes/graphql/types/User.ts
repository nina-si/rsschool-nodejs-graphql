import { FastifyInstance } from 'fastify';
import {
  GraphQLList,
  GraphQLObjectType,
  GraphQLString,
  GraphQLID,
} from 'graphql';
import { UserEntity } from '../../../utils/DB/entities/DBUsers';
import ProfileType from './Profile';
import PostType from './Post';
import MemberType from './MemberType';

export const UserType: GraphQLObjectType = new GraphQLObjectType({
  name: 'user',
  fields: () => ({
    id: { type: GraphQLID },
    firstName: { type: GraphQLString },
    lastName: { type: GraphQLString },
    email: { type: GraphQLString },
    subscribedToUserIds: { type: new GraphQLList(GraphQLString) },
    profile: {
      type: ProfileType,
      resolve: async (user: UserEntity, _, fastify: FastifyInstance) =>
        await fastify.db.profiles.findOne({ key: 'userId', equals: user.id }),
    },
    posts: {
      type: new GraphQLList(PostType),
      resolve: async (user: UserEntity, _, fastify: FastifyInstance) =>
        await fastify.db.posts.findMany({ key: 'userId', equals: user.id }),
    },
    memberType: {
      type: MemberType,
      resolve: async (user: UserEntity, _, fastify: FastifyInstance) => {
        const currentProfile = await fastify.db.profiles.findOne({
          key: 'userId',
          equals: user.id,
        });
        return !currentProfile
          ? null
          : await fastify.db.memberTypes.findOne({
              key: 'id',
              equals: currentProfile.memberTypeId,
            });
      },
    },
    subscribedToUser: {
      type: new GraphQLList(UserType),
      resolve: async (user: UserEntity, _, fastify: FastifyInstance) =>
        await fastify.db.users.findMany({
          key: 'subscribedToUserIds',
          inArray: user.id,
        }),
    },
    userSubscribedTo: {
      type: new GraphQLList(UserType),
      resolve: async (user: UserEntity) => user.subscribedToUserIds,
    },
  }),
});
