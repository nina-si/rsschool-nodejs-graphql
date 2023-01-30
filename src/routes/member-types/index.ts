import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import { idParamSchema } from '../../utils/reusedSchemas';
import { changeMemberTypeBodySchema } from './schema';
import type { MemberTypeEntity } from '../../utils/DB/entities/DBMemberTypes';
import { ERRORS } from '../../utils/constants';

const plugin: FastifyPluginAsyncJsonSchemaToTs = async (
  fastify
): Promise<void> => {
  fastify.get('/', async function (request, reply): Promise<
    MemberTypeEntity[]
  > {
    return await fastify.db.memberTypes.findMany();
  });

  fastify.get(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<MemberTypeEntity | Error> {
      const memberType = await fastify.db.memberTypes.findOne({
        key: 'id',
        equals: request.params.id,
      });
      if (!memberType) {
        return fastify.httpErrors.notFound(ERRORS.MEMBERTYPE_NOT_FOUND);
      }
      return memberType;
    }
  );

  fastify.patch(
    '/:id',
    {
      schema: {
        body: changeMemberTypeBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<MemberTypeEntity | Error> {
      const memberType = await fastify.db.memberTypes.findOne({
        key: 'id',
        equals: request.params.id,
      });
      if (!memberType) {
        return fastify.httpErrors.badRequest(ERRORS.MEMBERTYPE_NOT_FOUND);
      }
      const newMemberType = await fastify.db.memberTypes.change(
        request.params.id,
        request.body
      );
      return !newMemberType
        ? fastify.httpErrors.notFound(ERRORS.MEMBERTYPE_NOT_FOUND)
        : newMemberType;
    }
  );
};

export default plugin;
