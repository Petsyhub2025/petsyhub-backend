import { Inject, Injectable } from '@nestjs/common';
import { Neo4jDeleteHandler } from '@graphsync/shared-module/utils/neo4j-delete-handler.service';
import {
  Post,
  GraphPostNode,
  IPostModel,
  ModelNames,
  Neo4jService,
  NodeTypesEnum,
  RelationTypesEnum,
} from '@instapets-backend/common';

@Injectable()
export class PostSynchronizerService {
  constructor(
    private readonly neo4jService: Neo4jService,
    private readonly neo4jDeleteHandler: Neo4jDeleteHandler,
    @Inject(ModelNames.POST) private postModel: IPostModel,
  ) {}

  async syncToNeo4j(doc: Hydrate<Post>) {
    const post = await this.postModel.findById(doc._id);

    if (!post.isViewable) {
      await this.deleteFromNeo4j(post._id.toString());

      return;
    }

    await this.syncPostAllowedUsers(post);

    await this.syncPostHasTopics(post);

    const migrationProps = {
      props: {
        posts: [GraphPostNode.from(post)],
      },
    };

    await this.neo4jService.query(GraphPostNode.syncQuery, migrationProps);

    await this.neo4jService.query(GraphPostNode.syncHasTopicRelationQuery, migrationProps);
  }

  async deleteFromNeo4j(docId: string) {
    const deleteQuery = `
      MATCH (o:${NodeTypesEnum.POST} {postId: $id})
      DETACH DELETE o
    `;

    await this.neo4jDeleteHandler.neo4jDeleteHandler(PostSynchronizerService.name, docId, deleteQuery);
  }

  private async syncPostAllowedUsers(post: Hydrate<Post>) {
    if (!post.hasAllowedUsers || !post.allowedUsers?.length) return;

    const fetchQuery = `
      MATCH (p:${NodeTypesEnum.POST} {postId: $postId})<-[:${RelationTypesEnum.ALLOWED_TO_VIEW}]-(u:${NodeTypesEnum.USER})
      RETURN u.userId AS userId
    `;

    const allowedUserRecords = await this.neo4jService.query(fetchQuery, {
      postId: post._id.toString(),
    });

    if (!allowedUserRecords?.length) return;

    const allowedUserIds = allowedUserRecords?.map((record) => record.get('userId'));

    // Compare ids from post.allowedUsers to allowedUserIds from Neo4j and remove any user that is not in both
    const allowedUsersToRemove = allowedUserIds.filter(
      (id) => !post.allowedUsers.some((user) => user.toString() === id),
    );

    if (!allowedUsersToRemove.length) return;

    const deleteQuery = `
      MATCH (:${NodeTypesEnum.POST} {postId: $postId})<-[r:${RelationTypesEnum.ALLOWED_TO_VIEW}]-(:${NodeTypesEnum.USER} {userId: $userId})
      DELETE r
    `;

    await Promise.all(
      allowedUsersToRemove.map((userId) =>
        this.neo4jService.query(deleteQuery, {
          postId: post._id.toString(),
          userId,
        }),
      ),
    );
  }

  private async syncPostHasTopics(post: Hydrate<Post>) {
    if (!post.topics?.length) return;

    const fetchQuery = `
      MATCH (p:${NodeTypesEnum.POST} {postId: $postId})-[:${RelationTypesEnum.HAS_TOPIC}]->(t:${NodeTypesEnum.TOPIC})
      RETURN t.topicId AS topicId
    `;

    const postHasTopicsRecords = await this.neo4jService.query(fetchQuery, {
      postId: post._id.toString(),
    });

    if (!postHasTopicsRecords?.length) return;

    const postHasTopicsIds = postHasTopicsRecords?.map((record) => record.get('topicId'));

    // Compare ids from post.topics to includedInTopicsIds from Neo4j and remove any topic that is not in both
    const postHasTopicsToRemove = postHasTopicsIds.filter(
      (id) => !post.topics.some((topic) => topic.toString() === id),
    );

    if (!postHasTopicsToRemove.length) return;

    const deleteQuery = `
      MATCH (:${NodeTypesEnum.POST} {postId: $postId})->r:${RelationTypesEnum.HAS_TOPIC}]->(:${NodeTypesEnum.TOPIC} {topicId: $topicId})
      DELETE r
    `;

    await Promise.all(
      postHasTopicsToRemove.map((topicId) =>
        this.neo4jService.query(deleteQuery, {
          postId: post._id.toString(),
          topicId,
        }),
      ),
    );
  }
}
