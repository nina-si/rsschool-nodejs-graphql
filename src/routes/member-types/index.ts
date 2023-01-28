import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import { idParamSchema } from '../../utils/reusedSchemas';
import { changeMemberTypeBodySchema } from './schema';
import type { MemberTypeEntity } from '../../utils/DB/entities/DBMemberTypes';

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
        return fastify.httpErrors.notFound('Membertype not found');
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
        return fastify.httpErrors.badRequest('Membertype not found');
      }
      const newMemberType = await fastify.db.memberTypes.change(
        request.params.id,
        request.body
      );
      return !newMemberType
        ? fastify.httpErrors.notFound('Membertype not found')
        : newMemberType;
    }
  );
};

export default plugin;
