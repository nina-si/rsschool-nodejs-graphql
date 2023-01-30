import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import { idParamSchema } from '../../utils/reusedSchemas';
import { createProfileBodySchema, changeProfileBodySchema } from './schema';
import type { ProfileEntity } from '../../utils/DB/entities/DBProfiles';
import { ERRORS } from '../../utils/constants';

const plugin: FastifyPluginAsyncJsonSchemaToTs = async (
  fastify
): Promise<void> => {
  fastify.get('/', async function (request, reply): Promise<ProfileEntity[]> {
    return await fastify.db.profiles.findMany();
  });

  fastify.get(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<ProfileEntity | Error> {
      const profile = await fastify.db.profiles.findOne({
        key: 'id',
        equals: request.params.id,
      });
      return profile
        ? profile
        : fastify.httpErrors.notFound(ERRORS.PROFILE_NOT_FOUND);
    }
  );

  fastify.post(
    '/',
    {
      schema: {
        body: createProfileBodySchema,
      },
    },
    async function (request, reply): Promise<ProfileEntity | Error> {
      const profile = await fastify.db.profiles.findOne({
        key: 'userId',
        equals: request.body.userId,
      });
      if (profile) {
        return fastify.httpErrors.badRequest(ERRORS.PROFILE_EXISTS);
      }
      const memberType = await fastify.db.memberTypes.findOne({
        key: 'id',
        equals: request.body.memberTypeId,
      });
      if (!memberType) {
        return fastify.httpErrors.badRequest(ERRORS.MEMBERTYPE_NOT_FOUND);
      }
      return await fastify.db.profiles.create(request.body);
    }
  );

  fastify.delete(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<ProfileEntity | Error> {
      const profile = await fastify.db.profiles.findOne({
        key: 'id',
        equals: request.params.id,
      });
      return profile
        ? await fastify.db.profiles.delete(request.params.id)
        : fastify.httpErrors.badRequest(ERRORS.PROFILE_NOT_FOUND);
    }
  );

  fastify.patch(
    '/:id',
    {
      schema: {
        body: changeProfileBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<ProfileEntity | Error> {
      const profile = await fastify.db.profiles.findOne({
        key: 'id',
        equals: request.params.id,
      });
      return profile
        ? await fastify.db.profiles.change(request.params.id, request.body)
        : fastify.httpErrors.badRequest(ERRORS.PROFILE_NOT_FOUND);
    }
  );
};

export default plugin;
