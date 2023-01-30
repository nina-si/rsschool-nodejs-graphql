import { GraphQLID, GraphQLObjectType, GraphQLInt } from 'graphql';

const MemberType = new GraphQLObjectType({
  name: 'memberType',
  fields: () => ({
    id: { type: GraphQLID },
    discount: { type: GraphQLInt },
    monthPostsLimit: { type: GraphQLInt },
  }),
});

export default MemberType;
