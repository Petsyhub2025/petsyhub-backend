import { Relationship } from 'neo4j-driver';
import { neo4jDateParser } from './neo4j-date-parser.helper';

export function parseRelation(relation: Relationship): { type: string; properties: any } {
  return {
    type: relation.type,
    properties: {
      ...relation.properties,
      ...neo4jDateParser(relation),
    },
  };
}
