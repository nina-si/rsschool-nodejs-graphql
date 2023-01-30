import { GraphQLID, GraphQLObjectType, GraphQLString } from 'graphql';

const PostType = new GraphQLObjectType({
  name: 'post',
  fields: () => ({
    id: { type: GraphQLID },
    title: { type: GraphQLString },
    content: { type: GraphQLString },
    userId: { type: GraphQLID },
  }),
});

export default PostType;
