import { Injectable } from '@nestjs/common';
import { MAX_INTERACTIONS_TO_KEEP } from '@graphsync/shared/constants';
import { Neo4jService, NodeTypesEnum, RelationTypesEnum } from '@instapets-backend/common';

@Injectable()
export class MaintainUserInteractionsService {
  constructor(private readonly neo4jService: Neo4jService) {}

  async maintainUserInteractions(userId: string) {
    const interactionsToBeDeletedQuery = `
      MATCH (u:${NodeTypesEnum.USER} {userId: $userId})-[r:${RelationTypesEnum.INTERACTED_WITH}]->(pt)
      RETURN elementId(r) AS interactionId
      ORDER BY r.interactionDate DESC
      SKIP ${MAX_INTERACTIONS_TO_KEEP}
    `;

    const interactionsToBeDeleted = await this.neo4jService.query(interactionsToBeDeletedQuery, {
      userId: userId,
    });

    const deleteInteractionsQuery = `
      MATCH (u:${NodeTypesEnum.USER} {userId: $userId})-[r:${RelationTypesEnum.INTERACTED_WITH}]->(pt)
      WHERE elementId(r) IN $interactionIds
      DELETE r
    `;

    await this.neo4jService.query(deleteInteractionsQuery, {
      userId: userId,
      interactionIds: interactionsToBeDeleted.map((record) => record.get('interactionId')),
    });
  }
}
