import { HydratedDocument } from 'mongoose';
import { GraphBaseNode } from '@common/schemas/neo4j/nodes/common/base-node.node';
import { NodeTypesEnum } from '@common/schemas/neo4j/nodes/common/node-types.enum';
import { RelationTypesEnum } from '@common/schemas/neo4j/relations/common/relation-types.enum';
import { Post } from '@common/schemas/mongoose/post/post.type';

export class GraphPostNode extends GraphBaseNode<GraphPostNode> {
  public postId: string;
  public author: string;
  public userType: string;
  public hasAllowedUsers: boolean;
  public isPrivate: boolean;
  public postDegreeScore?: number;
  public allowedUsers: string[];
  public topics: string[];

  public static from(post: HydratedDocument<Post>) {
    const author = post.authorUser?.toString() || post.authorPet?.toString();
    if (!post._id || !author || !post.createdAt) return null;

    const postNode = new GraphPostNode({
      postId: post._id.toString(),
      author: author,
      userType: post.authorUser ? 'user' : 'pet',
      hasAllowedUsers: post.hasAllowedUsers,
      isPrivate: post.isPrivate,
      allowedUsers: post.allowedUsers.map((user) => user.toString()),
      createdAt: post.createdAt.toISOString(),
      type: NodeTypesEnum.POST,
      topics: post.topics.map((topic) => topic.toString()),
    });

    return postNode;
  }

  public static fromArray(posts: HydratedDocument<Post>[]) {
    return posts.map((post) => GraphPostNode.from(post)).filter((post) => post);
  }

  public static get syncQuery() {
    return `
      UNWIND $props.posts as post
      MERGE (p:${NodeTypesEnum.POST} {postId: post.postId})
      ON CREATE
        SET p.author = post.author,
            p.userType = post.userType,
            p.hasAllowedUsers = post.hasAllowedUsers,
            p.isPrivate = post.isPrivate,
            p.createdAt = post.createdAt,
            p.type = post.type,
            p.postDegreeScore = 0
      ON MATCH
        SET p.author = post.author,
            p.userType = post.userType,
            p.hasAllowedUsers = post.hasAllowedUsers,
            p.isPrivate = post.isPrivate
      WITH p, post
      OPTIONAL MATCH (u:${NodeTypesEnum.USER} {userId: post.author})
      OPTIONAL MATCH (pe:${NodeTypesEnum.PET} {petId: post.author})
      FOREACH(unUsedValue IN CASE WHEN u IS NOT NULL THEN [1] ELSE [] END | 
        MERGE (u)-[:${RelationTypesEnum.POSTED} {userType: post.userType, user: post.author, createdAt: datetime(post.createdAt), relationType: '${RelationTypesEnum.POSTED}'}]->(p)
        SET u.latestActivityDate = datetime(post.createdAt)
      )
      FOREACH(unUsedValue IN CASE WHEN pe IS NOT NULL THEN [1] ELSE [] END |
        MERGE (pe)-[:${RelationTypesEnum.POSTED} {userType: post.userType, user: post.author, createdAt: datetime(post.createdAt), relationType: '${RelationTypesEnum.POSTED}'}]->(p)
      )
      WITH p, post
      UNWIND post.allowedUsers as allowedUser
      MATCH (au:${NodeTypesEnum.USER} {userId: allowedUser})
      MERGE (au)-[:${RelationTypesEnum.ALLOWED_TO_VIEW} {relationType: '${RelationTypesEnum.ALLOWED_TO_VIEW}'}]->(p)
    `;
  }

  public static get syncHasTopicRelationQuery() {
    return `
      UNWIND $props.posts as post
      MATCH (p:${NodeTypesEnum.POST} {postId: post.postId})
      WITH p, post
      UNWIND post.topics as topic
      MATCH (t:${NodeTypesEnum.TOPIC} {topicId: topic})
      MERGE (p)-[:${RelationTypesEnum.HAS_TOPIC} {relationType: '${RelationTypesEnum.HAS_TOPIC}'}]->(t)
    `;
  }
}
